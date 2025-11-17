use chrono::Utc;
use sea_orm::{
    ActiveValue, ColumnTrait, EntityTrait, ExprTrait, IntoActiveModel, JoinType, QueryFilter,
    QuerySelect, RelationTrait, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    commands::notification::{
        create_notification_service, delete_notification_by_id_service,
        update_notification_by_id_service,
    },
    database::{get_db_manage, DbState},
    entities::{
        notification,
        prelude::TaskInDay,
        task::{self, TaskState},
        task_in_day,
    },
    utils::{
        datetime::parse_datetime_string,
        event::{
            broadcast_create_task_in_day, broadcast_delete_task_in_day,
            broadcast_update_task_in_days,
        },
        option3::Option3,
    },
};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SearchModel {
    // {
    //       startDate?: Date
    //       endDate?: Date
    //       isTaskDone?: boolean
    //       take?: number
    //     }
    pub task_id: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub is_task_done: Option<bool>,
    pub take: Option<i32>,
}

#[tauri::command]
pub async fn get_task_in_days(
    db_manage: tauri::State<'_, DbState>,
    search: SearchModel,
) -> Result<Vec<Value>, String> {
    let db_guard = get_db_manage(db_manage).await?;
    // 根据start_date end_date is_task_done take等条件进行查询
    let mut query = TaskInDay::find();
    if let Some(task_id) = search.task_id {
        query = query.filter(task_in_day::Column::TaskId.eq(task_id));
    }
    if let Some(start_date) = search.start_date {
        let start_datetime = parse_datetime_string(&start_date)?;
        query = query.filter(task_in_day::Column::Date.gte(start_datetime));
    }
    if let Some(end_date) = search.end_date {
        let end_datetime = parse_datetime_string(&end_date)?;
        query = query.filter(task_in_day::Column::Date.lte(end_datetime));
    }
    if let Some(is_task_done) = search.is_task_done {
        query = query.join(JoinType::LeftJoin, task_in_day::Relation::Task.def());
        query = if is_task_done {
            query.filter(task::Column::State.eq(TaskState::DONE))
        } else {
            query.filter(task::Column::State.ne(TaskState::DONE))
        }
    }
    if let Some(take) = search.take {
        query = query.limit(take as u64);
    }

    // 查找的时候join notification by notifiction_id
    let task_in_days = query
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    // 获取task_in_day_ids
    let ids = task_in_days
        .iter()
        .map(|t| t.notification_id.clone())
        .filter_map(|id| id)
        .collect::<Vec<String>>();
    let notifications = if ids.is_empty() {
        vec![]
    } else {
        notification::Entity::find()
            .filter(notification::Column::Id.is_in(ids))
            .all(db_guard.get_connection())
            .await
            .map_err(|e| e.to_string())?
    };

    // 将对应的notification塞到taskInDay.notification 中
    let mut result = vec![];
    for task_in_day in task_in_days {
        let mut task_in_day_json = serde_json::to_value(&task_in_day).map_err(|e| e.to_string())?;
        if let serde_json::Value::Object(ref mut map) = task_in_day_json {
            if let Some(notification_id) = task_in_day.notification_id {
                let related_notifications: Vec<notification::Model> = notifications
                    .iter()
                    .filter(|n| n.id == notification_id)
                    .cloned()
                    .collect();
                map.insert(
                    "notifications".to_string(),
                    serde_json::to_value(related_notifications.clone())
                        .map_err(|e| e.to_string())?,
                );
            }
        }
        result.push(task_in_day_json);
    }
    Ok(result)
}

#[tauri::command]
pub async fn create_task_in_day(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    data: task_in_day::CreateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let active_model: task_in_day::ActiveModel = task_in_day::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        color: ActiveValue::Set(data.color),
        task_id: ActiveValue::Set(data.task_id),
        r#type: ActiveValue::Set(data.r#type),
        date: ActiveValue::Set(parse_datetime_string(data.date.as_str())?),
        start_time: ActiveValue::Set(data.start_time),
        end_time: ActiveValue::Set(data.end_time),
        notification_id: ActiveValue::Set(data.notification_id),

        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task_in_day::Entity::insert(active_model)
        .exec_with_returning(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_create_task_in_day(&app_handle, res.clone());
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_in_day_by_id(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
    data: task_in_day::UpdateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    db_guard
        .get_connection()
        .transaction::<_, Value, String>(|txn| {
            Box::pin(async move {
                let pk = task_in_day::Entity::find_by_id(id);
                let task_in_day = pk
                    .one(txn)
                    .await
                    .map_err(|e| e.to_string())?
                    .ok_or_else(|| "TaskInDay not found".to_string())?;

                let mut task_in_day_active_model = task_in_day.clone().into_active_model();

                // Update fields from data
                if let Some(color) = data.color {
                    task_in_day_active_model.color = ActiveValue::Set(color);
                }
                if let Some(r#type) = data.r#type {
                    task_in_day_active_model.r#type = ActiveValue::Set(r#type);
                }
                if let Some(start_time) = data.start_time {
                    task_in_day_active_model.start_time = ActiveValue::Set(start_time);
                }
                if let Some(end_time) = data.end_time {
                    task_in_day_active_model.end_time = ActiveValue::Set(end_time);
                }
                if let Some(date) = data.date {
                    task_in_day_active_model.date =
                        ActiveValue::Set(parse_datetime_string(date.as_str())?);
                }
                if let Some(notification) = data.notification {
                    if let Some(notification_id) = task_in_day.notification_id.clone() {
                        // 已经有notification_id, 更新即可
                        update_notification_by_id_service(
                            txn,
                            notification_id.as_str(),
                            notification::UpdateModel {
                                content: Some(notification.content),
                                notify_at: Some(notification.notify_at),
                                title: Some(notification.title),
                            },
                        )
                        .await?;
                    } else {
                        // 创建新的notification
                        let new_notification =
                            create_notification_service(txn, notification).await?;
                        task_in_day_active_model.notification_id =
                            ActiveValue::Set(Some(new_notification.id));
                    }
                }
                if data.notification_id.is_null() {
                    // 删除通知
                    if let Some(notification_id) = task_in_day.notification_id {
                        delete_notification_by_id_service(txn, notification_id.as_str()).await?;
                    }
                }

                task_in_day_active_model.updated_at = ActiveValue::Set(Utc::now());

                let res = task_in_day::Entity::update(task_in_day_active_model)
                    .exec(txn)
                    .await
                    .map_err(|e| e.to_string())?;
                let _ = broadcast_update_task_in_days(&app_handle, vec![res.clone()]);
                // 拼接 notification 如果有
                if let Some(notification_id) = res.notification_id.clone() {
                    let notification = notification::Entity::find_by_id(notification_id)
                        .one(txn)
                        .await
                        .map_err(|e| e.to_string())?
                        .ok_or_else(|| "Notification not found".to_string())?;
                    let mut res_value =
                        serde_json::to_value(res.clone()).map_err(|e| e.to_string())?;
                    if let Some(obj) = res_value.as_object_mut() {
                        obj.insert(
                            "notification".to_string(),
                            serde_json::to_value(notification).map_err(|e| e.to_string())?,
                        );
                    }
                    Ok(serde_json::from_value(res_value).map_err(|e| e.to_string())?)
                } else {
                    Ok(serde_json::json!(res))
                }
            })
        })
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_in_day_by_id(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let db_guard = get_db_manage(db_manage).await?;
    let pk = task_in_day::Entity::find_by_id(id);
    let deleted_task_in_day = pk
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskInDay not found".to_string())?;

    let task_in_day_for_broadcast = deleted_task_in_day.clone();
    let active_model = deleted_task_in_day.into_active_model();

    task_in_day::Entity::delete(active_model)
        .exec(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_delete_task_in_day(&app_handle, task_in_day_for_broadcast);
    Ok(())
}
