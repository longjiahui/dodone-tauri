use serde::Serialize;
use tauri::Emitter;

fn broadcast(
    app_handler: &tauri::AppHandle,
    channel: &str,
    data: impl Serialize + Clone,
) -> Result<(), String> {
    app_handler
        .emit(channel, data)
        .map_err(|err| err.to_string())?;
    Ok(())
}

pub fn broadcast_batch_upsert_tasks(
    app_handler: &tauri::AppHandle,
    results: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handler, "batch_upsert_tasks", results)?;
    Ok(())
}

pub fn broadcast_delete_task(
    app_handler: &tauri::AppHandle,
    deleted_task: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handler, "delete_task", deleted_task)?;
    Ok(())
}

// pub fn broadcast_delete_task_view_tasks
