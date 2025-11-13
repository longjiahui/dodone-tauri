use serde_json::Value;

use crate::constants;

#[tauri::command]
pub fn set_const(app: tauri::AppHandle, key: String, value: String) -> Result<Value, String> {
    constants::set_const(&app, &key, &value)
}

#[tauri::command]
pub fn get_const(app: tauri::AppHandle, key: String) -> Result<Option<String>, String> {
    Ok(constants::get_const(&app, &key))
}
