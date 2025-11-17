use chrono::Utc;
use sea_orm::{ActiveValue, EntityTrait, IntoActiveModel, TransactionTrait};
use serde_json::Value;

use crate::{
    database::{get_db_manage, DbState},
    entities::{prelude::TaskGroup, task_group, OrderModel},
    utils::event::{broadcast_create_task_group, broadcast_delete_task_group},
};

#[tauri::command]
pub async fn get_task_groups(db_manage: tauri::State<'_, DbState>) -> Result<Vec<Value>, String> {
    let db_guard = get_db_manage(db_manage).await?;
    TaskGroup::find()
        .into_json()
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task_group_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    TaskGroup::find_by_id(id)
        .into_json()
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskGroup not found".to_string())
}

#[tauri::command]
pub async fn create_task_group(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    data: task_group::CreateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let active_model: task_group::ActiveModel = task_group::ActiveModel {
        sort_order: ActiveValue::Set(0),
        id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        color: ActiveValue::Set(data.color),
        icon: ActiveValue::Set(data.icon),
        name: ActiveValue::Set(data.name),
        description: ActiveValue::Set(data.description),
        is_archived: ActiveValue::Set(false),
        is_hide_anchors: ActiveValue::Set(false),
        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task_group::Entity::insert(active_model)
        .exec_with_returning(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_create_task_group(&app_handle, res.clone());
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_group_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
    data: task_group::UpdateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let pk = task_group::Entity::find_by_id(id);
    let mut active_model = pk
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskGroup not found".to_string())?
        .into_active_model();

    // Update fields from data
    if let Some(color) = data.color {
        active_model.color = ActiveValue::Set(color);
    }
    if let Some(name) = data.name {
        active_model.name = ActiveValue::Set(name);
    }
    if let Some(icon) = data.icon {
        active_model.icon = ActiveValue::Set(icon);
    }
    if let Some(description) = data.description {
        active_model.description = ActiveValue::Set(description);
    }
    if let Some(is_archived) = data.is_archived {
        active_model.is_archived = ActiveValue::Set(if let Some(is_archived) = is_archived {
            is_archived
        } else {
            false
        });
    }
    if let Some(is_hide_anchors) = data.is_hide_anchors {
        active_model.is_hide_anchors =
            ActiveValue::Set(if let Some(is_hide_anchors) = is_hide_anchors {
                is_hide_anchors
            } else {
                false
            });
    }

    active_model.updated_at = ActiveValue::Set(Utc::now());

    let res = task_group::Entity::update(active_model)
        .exec(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_group_by_id(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let db_guard = get_db_manage(db_manage).await?;
    let pk = task_group::Entity::find_by_id(id);
    let deleted_task_group = pk
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskGroup not found".to_string())?;

    let task_group_for_broadcast = deleted_task_group.clone();
    let active_model = deleted_task_group.into_active_model();

    task_group::Entity::delete(active_model)
        .exec(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_delete_task_group(&app_handle, task_group_for_broadcast);
    Ok(())
}

#[tauri::command]
pub async fn change_task_group_orders(
    db_manage: tauri::State<'_, DbState>,
    datas: Vec<OrderModel>,
) -> Result<(), String> {
    let db_guard = get_db_manage(db_manage).await?;
    // use transaction
    let txn = db_guard
        .get_connection()
        .begin()
        .await
        .map_err(|e| e.to_string())?;
    for (index, data) in datas.into_iter().enumerate() {
        let pk = task_group::Entity::find_by_id(data.id);

        let mut active_model = pk
            .one(&txn)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "TaskGroup not found".to_string())?
            .into_active_model();
        active_model.sort_order = ActiveValue::Set(index as i32);
        active_model.updated_at = ActiveValue::Set(Utc::now());
        task_group::Entity::update(active_model)
            .exec(&txn)
            .await
            .map_err(|e| e.to_string())?;
    }
    txn.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
