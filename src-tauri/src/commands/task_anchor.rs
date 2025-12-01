use chrono::Utc;
use sea_orm::{ActiveValue, EntityTrait, IntoActiveModel, TransactionTrait};
use serde_json::Value;

use crate::{
    database::{get_db_manage, DbState},
    entities::{prelude::TaskAnchor, task_anchor, OrderModel},
};

#[tauri::command]
pub async fn get_task_anchors(db_manage: tauri::State<'_, DbState>) -> Result<Vec<Value>, String> {
    let db_guard = get_db_manage(db_manage).await?;
    TaskAnchor::find()
        .into_json()
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task_anchor(
    db_manage: tauri::State<'_, DbState>,
    data: task_anchor::CreateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let active_model: task_anchor::ActiveModel = task_anchor::ActiveModel {
        sort_order: ActiveValue::Set(if let Some(order) = data.sort_order {
            order
        } else {
            0
        }),
        id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        task_id: ActiveValue::Set(data.task_id),
        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task_anchor::Entity::insert(active_model)
        .exec_with_returning(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_anchor_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let db_guard = get_db_manage(db_manage).await?;
    let pk = task_anchor::Entity::find_by_id(id);
    let deleted_task_anchor = pk
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskAnchor not found".to_string())?;

    let active_model = deleted_task_anchor.into_active_model();

    task_anchor::Entity::delete(active_model)
        .exec(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn change_task_anchor_orders(
    db_manage: tauri::State<'_, DbState>,
    // creates: Vec<task_anchor::CreateModel>,
    datas: Vec<OrderModel>,
) -> Result<(), String> {
    let db_guard = get_db_manage(db_manage).await?;
    // use transaction
    let txn = db_guard
        .get_connection()
        .begin()
        .await
        .map_err(|e| e.to_string())?;

    // create
    // let mut created: Vec<task_anchor::Model> = Vec::new();
    // for create in creates {
    //     let active_model: task_anchor::ActiveModel = task_anchor::ActiveModel {
    //         sort_order: ActiveValue::Set(if let Some(order) = create.sort_order {
    //             order
    //         } else {
    //             0
    //         }),
    //         id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
    //         task_id: ActiveValue::Set(create.task_id),
    //         created_at: ActiveValue::Set(Utc::now()),
    //         updated_at: ActiveValue::Set(Utc::now()),
    //         ..Default::default()
    //     };
    //     let res = task_anchor::Entity::insert(active_model)
    //         .exec_with_returning(&txn)
    //         .await
    //         .map_err(|e| e.to_string())?;
    //     created.push(res);
    // }
    for (_i, data) in datas.into_iter().enumerate() {
        let pk = task_anchor::Entity::find_by_id(data.id);

        let mut active_model = pk
            .one(&txn)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "TaskAnchor not found".to_string())?
            .into_active_model();
        active_model.sort_order = ActiveValue::Set(data.sort_order);
        active_model.updated_at = ActiveValue::Set(Utc::now());
        task_anchor::Entity::update(active_model)
            .exec(&txn)
            .await
            .map_err(|e| e.to_string())?;
    }
    txn.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
