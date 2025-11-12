use std::fs::create_dir_all;

use tauri::{self, Manager};

// tauri user data directory constant
pub fn get_app_data_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    app.path().app_data_dir().unwrap()
}

pub fn get_database_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let mut path = get_app_data_dir(app);
    path.push("database");
    create_dir_all(&path).unwrap();
    path
}

pub fn get_image_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let mut path = get_app_data_dir(app);
    path.push("image");
    create_dir_all(&path).unwrap();
    path
}

pub const IMAGE_PROTOCOL_NAME: &str = "image";
pub fn get_image_protocol_path(name: &str) -> String {
    format!("{}://{}", IMAGE_PROTOCOL_NAME, name)
}
