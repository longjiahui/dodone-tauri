use std::fs::create_dir_all;

use tauri::{self, Manager};

// tauri user data directory constant
pub fn get_user_data_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    app.path().app_local_data_dir().unwrap()
}

pub fn get_database_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let mut path = get_user_data_dir(app);
    path.push("database");
    create_dir_all(&path).unwrap();
    path
}
