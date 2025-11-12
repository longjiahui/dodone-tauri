use chrono::Utc;
use sea_orm::{ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter};
use serde_json::Value;

use crate::{
    database::DbState,
    entities::{
        prelude::TaskView,
        task_view::{self, TaskViewType},
        task_view_task::{self, Column as TaskViewTaskColumn},
    },
    utils::{event::broadcast_delete_task_view_tasks, option3::Option3},
};

#[tauri::command]
pub async fn get_task_views(db_manage: tauri::State<'_, DbState>) -> Result<Vec<Value>, String> {
    TaskView::find()
        .into_json()
        .all(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task_view(
    db_manage: tauri::State<'_, DbState>,
    data: task_view::CreateModel,
) -> Result<Value, String> {
    let active_model: task_view::ActiveModel = task_view::ActiveModel {
        sort_order: ActiveValue::Set(0),
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        icon: ActiveValue::Set(data.icon),
        name: ActiveValue::Set(data.name),
        description: ActiveValue::Set(data.description),
        r#type: ActiveValue::Set(data.r#type),
        define_mode: ActiveValue::Set(match data.define_mode {
            Some(mode) => mode,
            None => task_view::TaskViewDefineMode::GUI,
        }),
        guijson_data: ActiveValue::Set(data.guijson_data),
        auto_script: ActiveValue::Set(data.auto_script),

        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task_view::Entity::insert(active_model)
        .exec_with_returning(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_view_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
    data: task_view::UpdateModel,
) -> Result<Value, String> {
    let pk = task_view::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let mut active_model = pk
        .one(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskView not found".to_string())?
        .into_active_model();

    // Update fields from data
    if let Some(name) = data.name {
        active_model.name = ActiveValue::Set(name);
    }
    if let Some(define_model) = data.define_mode {
        active_model.define_mode = ActiveValue::Set(define_model)
    }
    if data.description != Option3::Undefined {
        active_model.description = match data.description.as_option() {
            Some(desc) => ActiveValue::Set(Some(desc)),
            None => ActiveValue::Set(None),
        };
    }
    if data.icon != Option3::Undefined {
        active_model.icon = match data.icon.as_option() {
            Some(icon) => ActiveValue::Set(Some(icon)),
            None => ActiveValue::Set(None),
        };
    }
    if data.guijson_data != Option3::Undefined {
        active_model.guijson_data = match data.guijson_data.as_option() {
            Some(data) => ActiveValue::Set(Some(data)),
            None => ActiveValue::Set(None),
        }
    }
    if data.auto_script != Option3::Undefined {
        active_model.auto_script = match data.auto_script.as_option() {
            Some(script) => ActiveValue::Set(Some(script)),
            None => ActiveValue::Set(None),
        }
    }

    active_model.updated_at = ActiveValue::Set(Utc::now());

    let res = task_view::Entity::update(active_model)
        .exec(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(res).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_view_by_id(
    app_handler: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let pk = task_view::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let deleted_task_view = pk
        .one(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "TaskView not found".to_string())?;

    let deleted_task_view_for_broadcast = deleted_task_view.clone();
    let active_model = deleted_task_view.into_active_model();

    task_view::Entity::delete(active_model)
        .exec(db_manage.lock().await.get_connection())
        .await
        .map_err(|e| e.to_string())?;

    if deleted_task_view_for_broadcast.r#type == TaskViewType::ALTERNATIVE {
        let deleted_task_view_tasks = task_view_task::Entity::find()
            .filter(TaskViewTaskColumn::TaskViewId.eq(deleted_task_view_for_broadcast.id))
            .all(db_manage.lock().await.get_connection())
            .await
            .map_err(|e| e.to_string())?;
        let _ = broadcast_delete_task_view_tasks(&app_handler, deleted_task_view_tasks);
    }
    Ok(())
}
