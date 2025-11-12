use std::vec;

use chrono::{DateTime, TimeZone, Utc};
use futures::{future::BoxFuture, FutureExt};
use sea_orm::{
    ActiveValue, ColumnTrait, DbErr, EntityTrait, IntoActiveModel, LoaderTrait, QueryFilter,
    TransactionTrait,
};
use serde_json::Value;
use uuid::Uuid;

use crate::{
    database::DbState,
    entities::next_task,
    utils::{datetime::parse_datetime_string, option3::Option3},
};

#[tauri::command]
pub async fn get_next_tasks(db_manage: tauri::State<'_, DbState>) -> Result<Value, String> {
    let db_guard = db_manage.lock().await;
    let db = db_guard.get_connection();
    let next_tasks = next_task::Entity::find()
        .all(db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(serde_json::json!(next_tasks))
}

#[tauri::command]
pub async fn create_next_task(
    db_manage: tauri::State<'_, DbState>,
    data: next_task::CreateModel,
) -> Result<Value, String> {
    let active_model: next_task::ActiveModel = next_task::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        mode: ActiveValue::Set(next_task::NextTaskMode::SIMPLE),
        a: ActiveValue::Set(data.a),
        b: ActiveValue::Set(data.b),
        task_id: ActiveValue::Set(Uuid::parse_str(&data.task_id).map_err(|err| err.to_string())?),

        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = next_task::Entity::insert(active_model)
        .exec_with_returning(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    Ok(serde_json::json!(res))
}

fn update_next_task_by_active_model(
    model: &mut next_task::ActiveModel,
    data: next_task::UpdateModel,
) -> Result<(), String> {
    if let Some(mode) = data.mode {
        model.mode = ActiveValue::Set(mode);
    }
    if let Some(a) = data.a {
        model.a = ActiveValue::Set(a);
    }
    if let Some(b) = data.b {
        model.b = ActiveValue::Set(b);
    }
    if data.end_date != Option3::Undefined {
        model.end_date = ActiveValue::Set(if let Some(end_date) = data.end_date.as_option() {
            Some(parse_datetime_string(&end_date)?)
        } else {
            None
        });
    }
    model.updated_at = ActiveValue::Set(Utc::now());
    Ok(())
}

#[tauri::command]
pub async fn update_next_task_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
    data: next_task::UpdateModel,
) -> Result<Value, String> {
    let pk = next_task::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let mut active_model = pk
        .one(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Next_task not found".to_string())?
        .into_active_model();

    update_next_task_by_active_model(&mut active_model, data)?;

    let res = next_task::Entity::update(active_model)
        .exec(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!(res))
}

#[tauri::command]
pub async fn delete_next_task_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let pk = next_task::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let deleted_next_task = pk
        .one(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Next_task not found".to_string())?;

    let next_task_for_broadcast = deleted_next_task.clone();
    let active_model = deleted_next_task.into_active_model();

    next_task::Entity::delete(active_model)
        .exec(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
