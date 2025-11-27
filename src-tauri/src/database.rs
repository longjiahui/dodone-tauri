use std::sync::Arc;

use crate::{
    constants::{
        get_const_current_db_name, get_database_path, set_const_current_db_name,
        DEFAULT_DATABASE_FILE_NAME,
    },
    utils::event::broadcast_switch_database,
};

use futures::lock::Mutex;
use migration::MigratorTrait;
use sea_orm::{Database, DatabaseConnection};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

pub type DbState = Arc<Mutex<Option<DatabaseManager>>>;

#[derive(Clone)]
pub struct DatabaseManager {
    connection: DatabaseConnection,
}

pub async fn get_db_manage(db_state: tauri::State<'_, DbState>) -> Result<DatabaseManager, String> {
    let db_guard = db_state.lock().await;
    if let Some(db_manage) = db_guard.as_ref() {
        return Ok(db_manage.clone());
    } else {
        Err("Database not initialized".to_string())
    }
}

pub fn make_db_state(db: Option<DatabaseManager>) -> DbState {
    Arc::new(Mutex::new(db))
}

pub async fn switch_database(app: &AppHandle, file: &str) -> Result<DatabaseManager, String> {
    let db_path = get_database_path(app, file);
    if !db_path.exists() {
        return Err("Database file does not exist".to_string());
    }
    let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());
    let db = Database::connect(&db_url)
        .await
        .map_err(|e| e.to_string())?;
    // close origin connection
    // shift state
    if let Some(state) = app.try_state::<DbState>() {
        let mut db_guard = state.lock().await;
        *db_guard = Some(DatabaseManager::new(db.clone()));
    } else {
        app.manage(make_db_state(Some(DatabaseManager::new(db.clone()))));
    }
    set_const_current_db_name(app, file)?;
    broadcast_switch_database(app, file)?;
    Ok(DatabaseManager::new(db))
}

impl DatabaseManager {
    pub fn new(connection: DatabaseConnection) -> Self {
        Self { connection }
    }

    pub fn get_connection(&self) -> &DatabaseConnection {
        &self.connection
    }

    pub async fn close_connection(self) -> Result<(), String> {
        self.connection.close().await.map_err(|err| err.to_string())
    }
}

async fn connect_current_db(
    app: &AppHandle,
) -> Result<DatabaseManager, Box<dyn std::error::Error>> {
    let current_db_name = get_const_current_db_name(app);
    let current_db_path = get_database_path(
        app,
        match current_db_name.as_ref() {
            Some(name) => name,
            None => DEFAULT_DATABASE_FILE_NAME,
        },
    );
    let db_url = format!("sqlite://{}?mode=rwc", current_db_path.to_string_lossy());
    let db = Database::connect(&db_url).await?;
    Ok(DatabaseManager { connection: db })
}

pub async fn init_database(app: &AppHandle) -> Result<DatabaseManager, Box<dyn std::error::Error>> {
    let db_manage = connect_current_db(app).await?;
    migrate_db(app, &db_manage).await?;
    Ok(db_manage)
}

pub async fn create_db_without_closing(
    app: &AppHandle,
    file: &str,
) -> Result<DatabaseManager, String> {
    let db_path = get_database_path(app, file);
    let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());
    let db = Database::connect(&db_url)
        .await
        .map_err(|err| err.to_string())?;
    let db_manage = DatabaseManager::new(db);
    migrate_db(app, &db_manage).await?;
    Ok(db_manage)
}

pub async fn create_db(app: &AppHandle, file: &str) -> Result<(), String> {
    let db_manage = create_db_without_closing(app, file).await?;
    db_manage.close_connection().await?;
    Ok(())
}

pub async fn delete_db(app: &AppHandle, file: &str) -> Result<(), String> {
    // 如果是正在使用的database
    if let Some(name) = get_const_current_db_name(app) {
        if name == file {
            return Err("Cannot delete the database that is currently in use".to_string());
        }
    }
    let db_path = get_database_path(app, file);
    if db_path.exists() {
        std::fs::remove_file(db_path).map_err(|err| err.to_string())?;
    }
    Ok(())
}

async fn migrate_db(
    app_handle: &tauri::AppHandle,
    db_manage: &DatabaseManager,
) -> Result<(), String> {
    let db = db_manage.get_connection();
    let ret = migration::Migrator::up(db, None).await;
    match ret {
        Err(e) => {
            println!(
                "Database migration error: {}, backup data and fresh file and report data loss",
                e
            );
            app_handle
                .dialog()
                .message("数据可能损坏，将重新创建数据文件。")
                .blocking_show();
            let current_db_name = get_const_current_db_name(app_handle);
            let db_file_name = match current_db_name.as_ref() {
                Some(name) => name,
                None => DEFAULT_DATABASE_FILE_NAME,
            };
            let db_path = get_database_path(app_handle, db_file_name);
            let backup_path = db_path.with_extension("bak");
            let origin_file_content = std::fs::read(&db_path)
                .map_err(|err| format!("Failed to read database file for backup: {}", err))?;
            std::fs::write(&backup_path, origin_file_content).map_err(|err| err.to_string())?;
            migration::Migrator::fresh(db)
                .await
                .map_err(|err| err.to_string())?;
        }
        Ok(_) => {}
    }
    Ok(())
}
