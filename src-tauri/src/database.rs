use std::sync::Arc;

use crate::constants::get_database_dir;

use super::entities::prelude::*;
use futures::lock::Mutex;
use sea_orm::{Database, DatabaseConnection};
use tauri::AppHandle;

pub type DbState = Arc<Mutex<DatabaseManager>>;

pub struct DatabaseManager {
    connection: DatabaseConnection,
}

impl DatabaseManager {
    pub fn new(connection: DatabaseConnection) -> Self {
        Self { connection }
    }

    pub fn get_connection(&self) -> &DatabaseConnection {
        &self.connection
    }
}

pub async fn init_database(app: &AppHandle) -> Result<DatabaseManager, Box<dyn std::error::Error>> {
    // get user data dir
    let database_dir = get_database_dir(app);
    let db_path = database_dir.join("default.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
    let db = Database::connect(&db_url).await?;
    db.get_schema_builder()
        .register(Task)
        .register(TaskGroup)
        .register(TaskAnchor)
        .register(TaskInDay)
        .register(TaskTargetRecord)
        .register(TaskView)
        .register(TaskViewTask)
        .register(NextTask)
        .register(Notification)
        .sync(&db)
        .await?;
    Ok(DatabaseManager::new(db))
}
