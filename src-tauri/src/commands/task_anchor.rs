use chrono::Utc;
use sea_orm::{ActiveValue, EntityTrait, IntoActiveModel};
use serde_json::Value;

use crate::{
    database::DbState,
    entities::{prelude::TaskAnchor, task_anchor},
};

#[tauri::command]
pub async fn get_task_anchors(db_manage: tauri::State<'_, DbState>) -> Result<Vec<Value>, String> {
    TaskAnchor::find()
        .into_json()
        .all(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task_anchor(
    db_manage: tauri::State<'_, DbState>,
    data: task_anchor::CreateModel,
) -> Result<Value, String> {
    let active_model: task_anchor::ActiveModel = task_anchor::ActiveModel {
        sort_order: ActiveValue::Set(0),
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        task_id: ActiveValue::Set(uuid::Uuid::parse_str(&data.task_id).map_err(|e| e.to_string())?),
        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task_anchor::Entity::insert(active_model)
        .exec_with_returning(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_anchor_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let pk =
        task_anchor::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let deleted_task_anchor = pk
        .one(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskAnchor not found".to_string())?;

    let active_model = deleted_task_anchor.into_active_model();

    task_anchor::Entity::delete(active_model)
        .exec(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
