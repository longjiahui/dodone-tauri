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

pub fn broadcast_delete_task_group(
    app_handler: &tauri::AppHandle,
    deleted_task_group: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handler, "delete_task_group", deleted_task_group)?;
    Ok(())
}

pub fn broadcast_create_task_group(
    app_handler: &tauri::AppHandle,
    created_task_group: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handler, "create_task_group", created_task_group)?;
    Ok(())
}

pub fn broadcast_create_task_view_task(
    app_handler: &tauri::AppHandle,
    created_task_view_task: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handler, "create_task_view_task", created_task_view_task)?;
    Ok(())
}
pub fn broadcast_delete_task_view_tasks(
    app_handler: &tauri::AppHandle,
    deleted_task_view_tasks: Vec<impl Serialize + Clone>,
) -> Result<(), String> {
    broadcast(
        app_handler,
        "delete_task_view_tasks",
        deleted_task_view_tasks,
    )?;
    Ok(())
}

// taskinday
pub fn broadcast_delete_task_in_day(
    app_handler: &tauri::AppHandle,
    deleted_task_in_day: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handler, "delete_task_in_day", deleted_task_in_day)?;
    Ok(())
}
pub fn broadcast_create_task_in_day(
    app_handler: &tauri::AppHandle,
    created_task_in_day: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handler, "create_task_in_day", created_task_in_day)?;
    Ok(())
}
// update taskinday
pub fn broadcast_update_task_in_days(
    app_handler: &tauri::AppHandle,
    updated_task_in_days: Vec<impl Serialize + Clone>,
) -> Result<(), String> {
    broadcast(app_handler, "update_task_in_days", updated_task_in_days)?;
    Ok(())
}
