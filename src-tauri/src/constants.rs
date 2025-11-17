use std::{fs::create_dir_all, path::PathBuf};

use serde_json::Value;
use tauri::{self, path::BaseDirectory, Manager, Theme};
use tokio::fs::create_dir;

use crate::utils::event::broadcast_update_const;

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

pub const DEFAULT_DATABASE_FILE_NAME: &str = "default.dodone";

pub fn get_database_path(app: &tauri::AppHandle, file: &str) -> std::path::PathBuf {
    let mut path = get_database_dir(app);
    path.push(file);
    path
}

pub fn get_image_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let mut path = get_app_data_dir(app);
    path.push("image");
    create_dir_all(&path).unwrap();
    path
}

pub fn get_const_path(app: &tauri::AppHandle) -> PathBuf {
    let mut const_path = get_app_data_dir(app);
    const_path.push("const.json");
    const_path
}

pub fn get_public_resource(app: &tauri::AppHandle, path: &str) -> Result<PathBuf, String> {
    // 只需要和config中的resources路径保持一致即可
    let public_path = "../tauri-public";
    app.path()
        .resolve(format!("{public_path}/{}", path), BaseDirectory::Resource)
        .map_err(|err| err.to_string())
}

pub const IMAGE_PROTOCOL_NAME: &str = "image";
pub fn get_image_protocol_path(name: &str) -> String {
    // #[cfg(target_os = "windows")]
    // {
    //     format!("//{}.localhost/{}", IMAGE_PROTOCOL_NAME, name)
    // }
    // #[cfg(target_os = "macos")]
    // {
    format!("{}://{}", IMAGE_PROTOCOL_NAME, name)
    // }
}

pub fn get_const(app: &tauri::AppHandle, key: &str) -> Option<String> {
    let path = get_const_path(app);
    if path.exists() {
        let data = std::fs::read_to_string(path).unwrap_or("{}".to_string());
        let json: serde_json::Value = serde_json::from_str(&data).unwrap_or(serde_json::json!({}));
        if let Some(value) = json.get(key) {
            if value.is_string() {
                Some(value.as_str().unwrap().to_string())
            } else {
                Some(value.to_string())
            }
        } else {
            None
        }
    } else {
        None
    }
}

pub fn get_const_current_db_name(app: &tauri::AppHandle) -> Option<String> {
    get_const(app, "currentDBName")
}

pub fn set_const_current_db_name(app: &tauri::AppHandle, name: &str) -> Result<Value, String> {
    set_const(app, "currentDBName", name)
}

pub fn set_const(app: &tauri::AppHandle, key: &str, value: &str) -> Result<Value, String> {
    let path = get_const_path(app);
    let mut json = if path.exists() {
        let data = std::fs::read_to_string(&path).unwrap_or("{}".to_string());
        serde_json::from_str(&data).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };
    // apply color mode
    if key == "colorMode" {
        println!("set color mode to {}", value);
        let theme = match value {
            "system" => None,
            "dark" => Some(Theme::Dark),
            _ => Some(Theme::Light),
        };
        app.set_theme(theme);
    }
    json[key] = serde_json::Value::String(value.to_string());
    let json_string = serde_json::to_string_pretty(&json).map_err(|err| err.to_string())?;
    std::fs::write(path, json_string).map_err(|err| err.to_string())?;
    let _ = broadcast_update_const(app, json.clone());
    Ok(json)
}
