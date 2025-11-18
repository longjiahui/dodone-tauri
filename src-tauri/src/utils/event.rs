use serde::Serialize;
use tauri::Emitter;

fn broadcast(
    app_handle: &tauri::AppHandle,
    channel: &str,
    data: impl Serialize + Clone,
) -> Result<(), String> {
    app_handle
        .emit(channel, data)
        .map_err(|err| err.to_string())?;
    Ok(())
}

pub fn broadcast_batch_upsert_tasks(
    app_handle: &tauri::AppHandle,
    created: impl Serialize + Clone,
    updated: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(
        app_handle,
        "batch_upsert_tasks",
        serde_json::json!({
            "created": created,
            "updated": updated,
        }),
    )?;
    Ok(())
}

pub fn broadcast_batch_upsert_task_target_records(
    app_handle: &tauri::AppHandle,
    created: impl Serialize + Clone,
    updated: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(
        app_handle,
        "batch_upsert_task_target_records",
        serde_json::json!({
            "created": created,
            "updated": updated,
        }),
    )?;
    Ok(())
}

pub fn broadcast_delete_task_target_records(
    app_handle: &tauri::AppHandle,
    deleted_task_target_records: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(
        app_handle,
        "delete_task_target_records",
        deleted_task_target_records,
    )?;
    Ok(())
}

pub fn broadcast_delete_task(
    app_handle: &tauri::AppHandle,
    deleted_task: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handle, "delete_task", deleted_task)?;
    Ok(())
}

pub fn broadcast_delete_task_group(
    app_handle: &tauri::AppHandle,
    deleted_task_group: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handle, "delete_task_group", deleted_task_group)?;
    Ok(())
}

pub fn broadcast_create_task_group(
    app_handle: &tauri::AppHandle,
    created_task_group: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handle, "create_task_group", created_task_group)?;
    Ok(())
}

pub fn broadcast_create_task_view_task(
    app_handle: &tauri::AppHandle,
    created_task_view_task: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handle, "create_task_view_task", created_task_view_task)?;
    Ok(())
}
pub fn broadcast_delete_task_view_tasks(
    app_handle: &tauri::AppHandle,
    deleted_task_view_tasks: Vec<impl Serialize + Clone>,
) -> Result<(), String> {
    broadcast(
        app_handle,
        "delete_task_view_tasks",
        deleted_task_view_tasks,
    )?;
    Ok(())
}

// taskinday
pub fn broadcast_delete_task_in_day(
    app_handle: &tauri::AppHandle,
    deleted_task_in_day: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handle, "delete_task_in_day", deleted_task_in_day)?;
    Ok(())
}
pub fn broadcast_create_task_in_day(
    app_handle: &tauri::AppHandle,
    created_task_in_day: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handle, "create_task_in_day", created_task_in_day)?;
    Ok(())
}
// update taskinday
pub fn broadcast_update_task_in_days(
    app_handle: &tauri::AppHandle,
    updated_task_in_days: Vec<impl Serialize + Clone>,
) -> Result<(), String> {
    broadcast(app_handle, "update_task_in_days", updated_task_in_days)?;
    Ok(())
}

// update const
pub fn broadcast_update_const(
    app_handle: &tauri::AppHandle,
    updated_const: impl Serialize + Clone,
) -> Result<(), String> {
    broadcast(app_handle, "update_const", updated_const)?;
    Ok(())
}
