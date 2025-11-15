use chrono::Utc;
use sea_orm::{ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter};
use serde::Deserialize;
use serde_json::Value;

use crate::{
    database::{get_db_manage, DbState},
    entities::{prelude::TaskTargetRecord, task_target_record},
    utils::datetime::parse_datetime_string,
};

#[derive(Debug, Deserialize, Clone)]
pub struct SearchModel {
    task_id: String,
}

#[tauri::command]
pub async fn get_task_target_records(
    db_manage: tauri::State<'_, DbState>,
    search: SearchModel,
) -> Result<Vec<Value>, String> {
    // search by task_id
    let db_guard = get_db_manage(db_manage).await?;
    TaskTargetRecord::find()
        .filter(
            task_target_record::Column::TaskId
                .eq(uuid::Uuid::parse_str(&search.task_id).map_err(|e| e.to_string())?),
        )
        .into_json()
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task_target_record(
    db_manage: tauri::State<'_, DbState>,
    data: task_target_record::CreateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let active_model: task_target_record::ActiveModel = task_target_record::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        value: ActiveValue::Set(data.value),
        record_at: ActiveValue::Set(Utc::now()),
        task_id: ActiveValue::Set(uuid::Uuid::parse_str(&data.task_id).map_err(|e| e.to_string())?),

        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task_target_record::Entity::insert(active_model)
        .exec_with_returning(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_target_record_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
    data: task_target_record::UpdateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let pk = task_target_record::Entity::find_by_id(
        uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?,
    );
    let mut active_model = pk
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskGroup not found".to_string())?
        .into_active_model();

    // Update fields from data
    if let Some(value) = data.value {
        active_model.value = ActiveValue::Set(value);
    }
    if let Some(record_at) = data.record_at {
        active_model.record_at = ActiveValue::Set(parse_datetime_string(&record_at)?);
    }

    active_model.updated_at = ActiveValue::Set(Utc::now());

    let res = task_target_record::Entity::update(active_model)
        .exec(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_target_record_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let db_guard = get_db_manage(db_manage).await?;
    let pk = task_target_record::Entity::find_by_id(
        uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?,
    );
    let deleted_task_target_record = pk
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskGroup not found".to_string())?;

    let active_model = deleted_task_target_record.into_active_model();

    task_target_record::Entity::delete(active_model)
        .exec(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
