use std::sync::Arc;

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

pub async fn init_database(_: &AppHandle) -> Result<DatabaseManager, Box<dyn std::error::Error>> {
    let db = Database::connect("sqlite::memory:").await?;
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
        .apply(&db)
        .await?;
    Ok(DatabaseManager::new(db))
}
