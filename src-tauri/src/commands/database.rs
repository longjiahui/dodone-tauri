use crate::{
    constants::{get_const_current_db_name, DEFAULT_DATABASE_FILE_NAME},
    database::{create_db, delete_db, shift_database},
};

#[tauri::command]
pub fn get_current_db_name(app_handle: tauri::AppHandle) -> Result<String, String> {
    Ok(match get_const_current_db_name(&app_handle) {
        Some(name) => name,
        None => DEFAULT_DATABASE_FILE_NAME.to_string(),
    })
}

#[tauri::command]
pub fn get_databases(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let db_dir = crate::constants::get_database_dir(&app_handle);
    let mut db_files = Vec::new();
    if db_dir.exists() && db_dir.is_dir() {
        for entry in std::fs::read_dir(db_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name() {
                    if let Some(file_name_str) = file_name.to_str() {
                        db_files.push(file_name_str.to_string());
                    }
                }
            }
        }
    }
    Ok(db_files)
}

#[tauri::command]
pub async fn create_database(app: tauri::AppHandle, name: String) -> Result<(), String> {
    create_db(&app, name.as_str()).await?;
    Ok(())
}

#[tauri::command]
pub async fn delete_database(app: tauri::AppHandle, name: String) -> Result<(), String> {
    delete_db(&app, name.as_str()).await?;
    Ok(())
}

#[tauri::command]
pub async fn switch_database(app: tauri::AppHandle, name: String) -> Result<(), String> {
    shift_database(&app, name.as_str()).await?;
    Ok(())
}
