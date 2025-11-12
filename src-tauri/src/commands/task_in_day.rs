use chrono::Utc;
use sea_orm::{
    ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, JoinType, QueryFilter, QuerySelect,
    RelationTrait,
};
use serde::{Deserialize, Serialize};
use serde_json::{de, Value};

use crate::{
    database::DbState,
    entities::{
        prelude::TaskInDay,
        task::{self, TaskState},
        task_in_day,
    },
    utils::{
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
    // 根据start_date end_date is_task_done take等条件进行查询
    let mut query = TaskInDay::find();
    if let Some(task_id) = search.task_id {
        query = query.filter(
            task_in_day::Column::TaskId
                .eq(uuid::Uuid::parse_str(&task_id).map_err(|e| e.to_string())?),
        );
    }
    if let Some(start_date) = search.start_date {
        let start_datetime = chrono::DateTime::parse_from_rfc3339(&start_date)
            .map_err(|e| e.to_string())?
            .with_timezone(&Utc);
        query = query.filter(task_in_day::Column::Date.gte(start_datetime));
    }
    if let Some(end_date) = search.end_date {
        let end_datetime = chrono::DateTime::parse_from_rfc3339(&end_date)
            .map_err(|e| e.to_string())?
            .with_timezone(&Utc);
        query = query.filter(task_in_day::Column::Date.lte(end_datetime));
    }
    if let Some(is_task_done) = search.is_task_done {
        query = query
            .join(JoinType::LeftJoin, task_in_day::Relation::Task.def())
            .filter(task::Column::State.eq(if is_task_done {
                TaskState::DONE
            } else {
                TaskState::UNDONE
            }));
    }
    if let Some(take) = search.take {
        query = query.limit(take as u64);
    }
    query
        .into_json()
        .all(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task_in_day(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    data: task_in_day::CreateModel,
) -> Result<Value, String> {
    let active_model: task_in_day::ActiveModel = task_in_day::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        color: ActiveValue::Set(data.color),
        task_id: ActiveValue::Set(uuid::Uuid::parse_str(&data.task_id).map_err(|e| e.to_string())?),
        r#type: ActiveValue::Set(data.r#type),
        date: ActiveValue::Set(data.date),
        start_time: ActiveValue::Set(data.start_time),
        end_time: ActiveValue::Set(data.end_time),
        notification_id: if let Some(notification_id) = data.notification_id {
            ActiveValue::Set(
                uuid::Uuid::parse_str(&notification_id)
                    .map(Some)
                    .map_err(|e| e.to_string())?,
            )
        } else {
            ActiveValue::Set(None)
        },

        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task_in_day::Entity::insert(active_model)
        .exec_with_returning(db_manage.lock().await.get_connection())
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
    let pk =
        task_in_day::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let mut active_model = pk
        .one(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskInDay not found".to_string())?
        .into_active_model();

    // Update fields from data
    if let Some(color) = data.color {
        active_model.color = ActiveValue::Set(color);
    }
    if let Some(r#type) = data.r#type {
        active_model.r#type = ActiveValue::Set(r#type);
    }
    if let Some(start_time) = data.start_time {
        active_model.start_time = ActiveValue::Set(start_time);
    }
    if let Some(end_time) = data.end_time {
        active_model.end_time = ActiveValue::Set(end_time);
    }
    if let Some(date) = data.date {
        active_model.date = ActiveValue::Set(date);
    }
    if data.notification_id != Option3::Undefined {
        active_model.notification_id = match data.notification_id.as_option() {
            Some(id_str) => ActiveValue::Set(Some(
                uuid::Uuid::parse_str(&id_str).map_err(|e| e.to_string())?,
            )),
            None => ActiveValue::Set(None),
        }
    }

    active_model.updated_at = ActiveValue::Set(Utc::now());

    let res = task_in_day::Entity::update(active_model)
        .exec(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;

    let _ = broadcast_update_task_in_days(&app_handle, vec![res.clone()]);

    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_in_day_by_id(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let pk =
        task_in_day::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let deleted_task_in_day = pk
        .one(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskInDay not found".to_string())?;

    let task_in_day_for_broadcast = deleted_task_in_day.clone();
    let active_model = deleted_task_in_day.into_active_model();

    task_in_day::Entity::delete(active_model)
        .exec(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_delete_task_in_day(&app_handle, task_in_day_for_broadcast);
    Ok(())
}
