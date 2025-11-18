use chrono::Utc;
use sea_orm::{
    ActiveValue, ColumnTrait, ConnectionTrait, EntityTrait, IntoActiveModel, QueryFilter,
    TransactionTrait,
};
use serde_json::Value;

use crate::{
    database::{get_db_manage, DbState},
    entities::{notification, prelude::Notification, task_in_day},
    utils::datetime::parse_datetime_string,
};

// notification 扔到前端处理了。。
#[tauri::command]
pub async fn get_notifications(db_manage: tauri::State<'_, DbState>) -> Result<Vec<Value>, String> {
    let db_guard = get_db_manage(db_manage).await?;
    Notification::find()
        .into_json()
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())
}

pub async fn delete_notification_by_id_service(
    txn: &impl ConnectionTrait,
    id: &str,
) -> Result<notification::Model, String> {
    let pk = notification::Entity::find_by_id(id);
    let deleted_notification = pk
        .one(txn)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Notification not found".to_string())?;

    let notification_for_return = deleted_notification.clone();
    let active_model = deleted_notification.into_active_model();

    notification::Entity::delete(active_model)
        .exec(txn)
        .await
        .map_err(|e| e.to_string())?;

    // 查找是否有taskInDay引用了这个notification
    if let Some(task_in_day_record) = task_in_day::Entity::find()
        .filter(task_in_day::Column::NotificationId.eq(notification_for_return.clone().id))
        .one(txn)
        .await
        .map_err(|e| e.to_string())?
    {
        // 删除 notification_id 字段
        let mut active_model = task_in_day_record.into_active_model();
        active_model.notification_id = ActiveValue::Set(None);
        active_model.updated_at = ActiveValue::Set(Utc::now());
        // 更新记录
        task_in_day::Entity::update(active_model)
            .exec(txn)
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(notification_for_return)
}

#[tauri::command]
pub async fn delete_notification_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    // 创建事务
    Ok(db_guard
        .get_connection()
        .transaction::<_, serde_json::Value, String>(|txn| {
            Box::pin(async move {
                // 删除对应的 notification 记录，并返回删除的记录
                let deleted_notification = delete_notification_by_id_service(txn, &id).await?;
                Ok(serde_json::json!(deleted_notification))
            })
        })
        .await
        .map_err(|e| e.to_string())?)
}

pub async fn create_notification_service(
    txn: &impl ConnectionTrait,
    data: notification::CreateModel,
) -> Result<notification::Model, String> {
    let active_model: notification::ActiveModel = notification::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        title: ActiveValue::Set(data.title),
        content: ActiveValue::Set(data.content),
        notify_at: ActiveValue::Set(parse_datetime_string(&data.notify_at)?),
        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = notification::Entity::insert(active_model)
        .exec_with_returning(txn)
        .await
        .map_err(|e| e.to_string())?;
    Ok(res)
}

pub async fn update_notification_by_id_service(
    txn: &impl ConnectionTrait,
    id: &str,
    data: notification::UpdateModel,
) -> Result<notification::Model, String> {
    let pk = notification::Entity::find_by_id(id);
    let mut active_model = pk
        .one(txn)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Notification not found".to_string())?
        .into_active_model();

    // Update fields from data
    if let Some(title) = data.title {
        active_model.title = ActiveValue::Set(title);
    }
    if let Some(content) = data.content {
        active_model.content = ActiveValue::Set(content);
    }
    if let Some(notify_at) = data.notify_at {
        active_model.notify_at = ActiveValue::Set(parse_datetime_string(&notify_at)?);
    }

    active_model.updated_at = ActiveValue::Set(Utc::now());

    let res = notification::Entity::update(active_model)
        .exec(txn)
        .await
        .map_err(|e| e.to_string())?;
    Ok(res)
}

// #[tauri::command]
// pub async fn create_notification(
//     app_handle: tauri::AppHandle,
//     db_manage: tauri::State<'_, DbState>,
//     data: notification::CreateModel,
// ) -> Result<Value, String> {
//     let active_model: notification::ActiveModel = notification::ActiveModel {
//         sort_order: ActiveValue::Set(0),
//         id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
//         color: ActiveValue::Set(data.color),
//         icon: ActiveValue::Set(data.icon),
//         name: ActiveValue::Set(data.name),
//         description: ActiveValue::Set(data.description),
//         is_archived: ActiveValue::Set(false),
//         is_hide_anchors: ActiveValue::Set(false),
//         created_at: ActiveValue::Set(Utc::now()),
//         updated_at: ActiveValue::Set(Utc::now()),
//         ..Default::default()
//     };
//     let res = notification::Entity::insert(active_model)
//         .exec_with_returning(db_guard.get_connection())
//         .await
//         .map_err(|e| e.to_string())?;
//     let _ = broadcast_create_notification(&app_handle, res.clone());
//     serde_json::to_value(res).map_err(|e| e.to_string())
// }

// #[tauri::command]
// pub async fn update_notification_by_id(
//     db_manage: tauri::State<'_, DbState>,
//     id: String,
//     data: notification::UpdateModel,
// ) -> Result<Value, String> {
//     let pk =
//         notification::Entity::find_by_id(id);
//     let mut active_model = pk
//         .one(db_guard.get_connection())
//         .await
//         .map_err(|e| e.to_string())?
//         .ok_or_else(|| "Notification not found".to_string())?
//         .into_active_model();

//     // Update fields from data
//     if let Some(color) = data.color {
//         active_model.color = ActiveValue::Set(color);
//     }
//     if let Some(name) = data.name {
//         active_model.name = ActiveValue::Set(name);
//     }
//     if let Some(icon) = data.icon {
//         active_model.icon = ActiveValue::Set(icon);
//     }
//     if let Some(description) = data.description {
//         active_model.description = ActiveValue::Set(description);
//     }
//     if let Some(is_archived) = data.is_archived {
//         active_model.is_archived = ActiveValue::Set(if let Some(is_archived) = is_archived {
//             is_archived
//         } else {
//             false
//         });
//     }
//     if let Some(is_hide_anchors) = data.is_hide_anchors {
//         active_model.is_hide_anchors =
//             ActiveValue::Set(if let Some(is_hide_anchors) = is_hide_anchors {
//                 is_hide_anchors
//             } else {
//                 false
//             });
//     }

//     active_model.updated_at = ActiveValue::Set(Utc::now());

//     let res = notification::Entity::update(active_model)
//         .exec(db_guard.get_connection())
//         .await
//         .map_err(|e| e.to_string())?;
//     serde_json::to_value(res).map_err(|e| e.to_string())
// }

// #[tauri::command]
// pub async fn delete_notification_by_id(
//     app_handle: tauri::AppHandle,
//     db_manage: tauri::State<'_, DbState>,
//     id: String,
// ) -> Result<(), String> {
//     let pk =
//         notification::Entity::find_by_id(id);
//     let deleted_notification = pk
//         .one(db_guard.get_connection())
//         .await
//         .map_err(|e| e.to_string())?
//         .ok_or_else(|| "Notification not found".to_string())?;

//     let notification_for_broadcast = deleted_notification.clone();
//     let active_model = deleted_notification.into_active_model();

//     notification::Entity::delete(active_model)
//         .exec(db_guard.get_connection())
//         .await
//         .map_err(|e| e.to_string())?;
//     let _ = broadcast_delete_notification(&app_handle, notification_for_broadcast);
//     Ok(())
// }
