#[tauri::command]
pub fn get_window_size(window: tauri::Window) -> Result<(f64, f64), String> {
    let size = window.outer_size().map_err(|e| e.to_string())?;
    Ok((size.width as f64, size.height as f64))
}

#[tauri::command]
pub fn set_window_size(window: tauri::Window, width: f64, height: f64) -> Result<(), String> {
    window
        .set_size(tauri::PhysicalSize {
            width: width as u32,
            height: height as u32,
        })
        .map_err(|e| e.to_string())
}
