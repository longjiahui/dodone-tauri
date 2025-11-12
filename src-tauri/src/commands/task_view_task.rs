use chrono::Utc;
use sea_orm::{ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    database::DbState,
    entities::{prelude::TaskViewTask, task_view_task},
    utils::event::{broadcast_create_task_view_task, broadcast_delete_task_view_tasks},
};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SearchModel {
    task_view_id: String,
}

#[tauri::command]
pub async fn get_task_view_tasks(
    db_manage: tauri::State<'_, DbState>,
    search: SearchModel,
) -> Result<Vec<Value>, String> {
    TaskViewTask::find()
        .filter(
            task_view_task::Column::TaskViewId
                .eq(uuid::Uuid::parse_str(&search.task_view_id).map_err(|e| e.to_string())?),
        )
        .into_json()
        .all(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task_view_task(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    data: task_view_task::CreateModel,
) -> Result<Value, String> {
    let active_model: task_view_task::ActiveModel = task_view_task::ActiveModel {
        sort_order: ActiveValue::Set(0),
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        task_id: ActiveValue::Set(uuid::Uuid::parse_str(&data.task_id).map_err(|e| e.to_string())?),
        task_view_id: ActiveValue::Set(
            uuid::Uuid::parse_str(&data.task_view_id).map_err(|e| e.to_string())?,
        ),
        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task_view_task::Entity::insert(active_model)
        .exec_with_returning(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_create_task_view_task(&app_handle, res.clone());
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_view_task_by_id(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let pk =
        task_view_task::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let deleted_task_view_task = pk
        .one(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskViewTask not found".to_string())?;

    let deleted_task_view_task_for_broadcast = deleted_task_view_task.clone();
    let active_model = deleted_task_view_task.into_active_model();

    task_view_task::Entity::delete(active_model)
        .exec(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;

    let _ =
        broadcast_delete_task_view_tasks(&app_handle, vec![deleted_task_view_task_for_broadcast]);
    Ok(())
}
