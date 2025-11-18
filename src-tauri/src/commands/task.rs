use std::vec;

use chrono::Utc;
use futures::{future::BoxFuture, FutureExt};
use sea_orm::{
    ActiveValue, ColumnTrait, ConnectionTrait, DbErr, EntityTrait, IntoActiveModel, LoaderTrait,
    ModelTrait, QueryFilter, TransactionTrait,
};
use serde_json::Value;

use crate::{
    database::{get_db_manage, DbState},
    entities::{
        next_task,
        prelude::Task,
        task::{self, BatchEditTasksResult, TaskState},
        task_target_record, task_view_task,
    },
    utils::{
        datetime::parse_datetime_string,
        event::{
            broadcast_batch_upsert_tasks, broadcast_delete_task,
            broadcast_delete_task_target_records, broadcast_delete_task_view_tasks,
        },
        option3::Option3,
    },
};

#[tauri::command]
pub async fn get_tasks(db_manage: tauri::State<'_, DbState>) -> Result<Vec<Value>, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let db = db_guard.get_connection();
    let tasks = Task::find().all(db).await.map_err(|e| e.to_string())?;
    // 加载关联数据
    let next_tasks = tasks
        .load_one(next_task::Entity, db)
        .await
        .map_err(|e| e.to_string())?;
    let task_view_tasks = tasks
        .load_many(task_view_task::Entity, db)
        .await
        .map_err(|e| e.to_string())?;

    // 组合数据
    let result: Vec<Value> = tasks
        .into_iter()
        .zip(next_tasks.into_iter())
        .zip(task_view_tasks.into_iter())
        .map(|((task, next_task), view_tasks)| {
            let mut task_json = serde_json::to_value(&task).map_err(|e| e.to_string())?;
            if let serde_json::Value::Object(ref mut map) = task_json {
                map.insert(
                    "taskViewTasks".to_string(),
                    serde_json::to_value(&view_tasks).map_err(|e| e.to_string())?,
                );
                map.insert(
                    "nextTask".to_string(),
                    serde_json::to_value(&next_task).map_err(|e| e.to_string())?,
                );
            }
            Ok(task_json)
        })
        .collect::<Result<Vec<Value>, String>>()?;
    Ok(result)
}

#[tauri::command]
pub async fn get_task_by_id(
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;

    let db = db_guard.get_connection();
    let task_id = id;

    let task = Task::find_by_id(task_id)
        .one(db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Task not found".to_string())?;

    // Load related data
    let next_task = task
        .find_related(next_task::Entity)
        .one(db)
        .await
        .map_err(|e| e.to_string())?;

    let task_view_tasks = task
        .find_related(task_view_task::Entity)
        .all(db)
        .await
        .map_err(|e| e.to_string())?;

    // Combine data
    let mut task_json = serde_json::to_value(&task).map_err(|e| e.to_string())?;
    if let serde_json::Value::Object(ref mut map) = task_json {
        map.insert(
            "taskViewTasks".to_string(),
            serde_json::to_value(&task_view_tasks).map_err(|e| e.to_string())?,
        );
        map.insert(
            "nextTask".to_string(),
            serde_json::to_value(&next_task).map_err(|e| e.to_string())?,
        );
    }

    Ok(task_json)
}

#[tauri::command]
pub async fn create_task(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    data: task::CreateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let active_model: task::ActiveModel = task::ActiveModel {
        sort_order: ActiveValue::Set(0),
        id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        content: ActiveValue::Set(data.content),
        state: ActiveValue::Set(TaskState::UNDONE),
        description: ActiveValue::Set(data.description),
        group_id: ActiveValue::Set(data.group_id),
        parent_id: if let Some(parent_id) = data.parent_id {
            ActiveValue::Set(Some(parent_id))
        } else {
            ActiveValue::NotSet
        },
        created_at: ActiveValue::Set(Utc::now()),
        updated_at: ActiveValue::Set(Utc::now()),
        ..Default::default()
    };
    let res = task::Entity::insert(active_model)
        .exec_with_returning(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_batch_upsert_tasks(
        &app_handle,
        serde_json::to_string(&vec![res.clone()]).map_err(|err| err.to_string())?,
        serde_json::to_string(&Vec::<task::Model>::new()).map_err(|err| err.to_string())?,
    );
    serde_json::to_value(res).map_err(|e| e.to_string())
}

struct UpdateTaskByActiveModelResult {
    deleted_task_target_records: Vec<task_target_record::Model>,
}

async fn update_task_by_active_model<C>(
    connection: &C,
    id: &str,
    model: &mut task::ActiveModel,
    data: &task::UpdateModel,
) -> Result<UpdateTaskByActiveModelResult, String>
where
    C: ConnectionTrait,
{
    if let Some(sort_order) = data.sort_order {
        model.sort_order = ActiveValue::Set(sort_order);
    }
    if let Some(group_id) = &data.group_id {
        model.group_id = ActiveValue::Set(group_id.clone())
    } else {
        model.group_id = ActiveValue::NotSet
    };
    if let Some(content) = &data.content {
        model.content = ActiveValue::Set(content.clone());
    }
    if data.description != Option3::Undefined {
        model.description = ActiveValue::Set(if let Some(desc) = data.description.as_option() {
            Some(desc.to_string())
        } else {
            None
        });
    }
    // if let Some(ref parent_id_str) = data.parent_id.as_option() {
    //     if let Some(ref task_id_uuid) = model.id.clone().take() {
    //         if parent_id_str == &task_id_uuid.to_string() {
    //             // 不能將parentid設置成自身
    //             // 报错返回
    //             return Err("Parent ID cannot be the same as the task ID".to_string());
    //         }
    //     }
    // }
    if data.parent_id != Option3::Undefined {
        // 从要设置的任务id 往上搜，直到没有parentid为止，看看有没有和自身id相同的，如果有相同的则报错返回
        let self_id = model.id.clone().take();
        if let Some(sid) = self_id {
            if let Some(ref parent_id_str) = data.parent_id.clone().as_option() {
                let mut current_id = Some(parent_id_str.clone());
                while let Some(cpid) = current_id {
                    if cpid == sid.to_string() {
                        return Err(
                            "Parent ID cannot be the same as the task ID or its descendants"
                                .to_string(),
                        );
                    }
                    // 获取当前id的parentid
                    // 这里不能使用model，因为model可能还没更新
                    let task_model = task::Entity::find_by_id(cpid)
                        .one(connection)
                        .await
                        .map_err(|e| e.to_string())?
                        .ok_or_else(|| "Task not found during parent ID check".to_string())?;
                    current_id = task_model.parent_id.map(|id| id.to_string());
                }
            }
        }

        model.parent_id = if let Some(parent_id) = data.parent_id.as_option() {
            ActiveValue::Set(Some(parent_id))
        } else {
            ActiveValue::Set(None)
        };
    }
    if let Some(state) = &data.state {
        model.state = ActiveValue::Set(state.clone());
    }
    if let Some(priority) = data.priority {
        model.priority = ActiveValue::Set(priority);
    }
    if let Some(factor) = data.factor {
        model.factor = ActiveValue::Set(factor);
    }
    if data.done_at != Option3::Undefined {
        model.done_at = ActiveValue::Set(if let Some(da) = data.done_at.as_option() {
            Some(parse_datetime_string(&da)?)
        } else {
            None
        });
    }
    if data.start_at != Option3::Undefined {
        model.start_at = ActiveValue::Set(if let Some(sa) = data.start_at.as_option() {
            Some(parse_datetime_string(&sa)?)
        } else {
            None
        });
    }
    if data.end_at != Option3::Undefined {
        model.end_at = ActiveValue::Set(if let Some(ea) = data.end_at.as_option() {
            Some(parse_datetime_string(&ea)?)
        } else {
            None
        });
    }
    if data.created_by_task_id != Option3::Undefined {
        model.created_by_task_id = if let Some(cbtid) = data.created_by_task_id.as_option() {
            ActiveValue::Set(Some(cbtid))
        } else {
            ActiveValue::Set(None)
        };
    }
    if let Some(create_index) = data.create_index {
        model.create_index = ActiveValue::Set(create_index);
    }
    let mut deleted_task_target_records = Vec::<task_target_record::Model>::new();
    if data.target != Option3::Undefined {
        model.target = ActiveValue::Set(if let Some(tgt) = data.target.as_option() {
            Some(tgt.clone())
        } else {
            None
        });
        if data.target == Option3::Null {
            // 删除所有目标records
            deleted_task_target_records = task_target_record::Entity::find()
                .filter(task_target_record::Column::TaskId.eq(id))
                .all(connection)
                .await
                .map_err(|e| e.to_string())?;
            task_target_record::Entity::delete_many()
                .filter(task_target_record::Column::TaskId.eq(id))
                .exec(connection)
                .await
                .map_err(|e| e.to_string())?;
        }
    }
    if data.target_type != Option3::Undefined {
        model.target_type = ActiveValue::Set(if let Some(tt) = data.target_type.as_option() {
            Some(tt.to_string())
        } else {
            None
        });
    }
    model.updated_at = ActiveValue::Set(Utc::now());
    Ok(UpdateTaskByActiveModelResult {
        deleted_task_target_records,
    })
}

#[tauri::command]
pub async fn update_task_by_id(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
    data: task::UpdateModel,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let db = db_guard.get_connection();
    let pk = task::Entity::find_by_id(id.clone());
    let mut active_model = pk
        .one(db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Task not found".to_string())?
        .into_active_model();

    let update_result =
        update_task_by_active_model(db, id.as_str(), &mut active_model, &data).await?;
    let res = task::Entity::update(active_model)
        .exec(db)
        .await
        .map_err(|e| e.to_string())?;

    // search for taskviewtasks
    let task_view_tasks = task_view_task::Entity::find()
        .filter(task_view_task::Column::TaskId.eq(res.id.clone()))
        .all(db)
        .await
        .map_err(|e| e.to_string())?;

    // 拼接数据并返回
    // serde_json::to_value(res).map_err(|e| e.to_string())
    let mut task_json = serde_json::to_value(&res).map_err(|e| e.to_string())?;
    if let serde_json::Value::Object(ref mut map) = task_json {
        map.insert(
            "task_view_tasks".to_string(),
            serde_json::to_value(&task_view_tasks).map_err(|e| e.to_string())?,
        );
    }

    let _ = broadcast_batch_upsert_tasks(
        &app_handle,
        Vec::<task::Model>::new(),
        Value::Array(vec![task_json.clone()]),
    );
    if data.target == Option3::Null && update_result.deleted_task_target_records.len() > 0 {
        let _ = broadcast_delete_task_target_records(
            &app_handle,
            update_result.deleted_task_target_records,
        )?;
    }
    Ok(task_json)
}

#[tauri::command]
pub async fn delete_task_by_id(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let db_guard = get_db_manage(db_manage).await?;
    let pk = task::Entity::find_by_id(id.clone());
    let deleted_task = pk
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Task not found".to_string())?;

    // 拼接关联的taskviewtasks
    let deleted_task_view_tasks = task_view_task::Entity::find()
        .filter(task_view_task::Column::TaskId.eq(deleted_task.id.clone()))
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;

    let mut deleted_task_json = serde_json::to_value(&deleted_task).map_err(|e| e.to_string())?;
    if let serde_json::Value::Object(ref mut map) = deleted_task_json {
        map.insert(
            "task_view_tasks".to_string(),
            serde_json::to_value(&deleted_task_view_tasks).map_err(|e| e.to_string())?,
        );
    }

    let active_model = deleted_task.into_active_model();

    task::Entity::delete(active_model)
        .exec(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_delete_task(&app_handle, deleted_task_json);
    let _ = broadcast_delete_task_view_tasks(&app_handle, deleted_task_view_tasks);
    Ok(())
}

fn batch_create_tasks<'a>(
    txn: &'a sea_orm::DatabaseTransaction,
    create: Vec<task::BatchCreateTaskModel>,
    parent_id: Option<String>,
) -> BoxFuture<'a, Result<Vec<task::Model>, String>> {
    async move {
        let mut all_results = Vec::new();
        for data in create {
            let task_id = uuid::Uuid::new_v4().to_string();

            let active_model = task::ActiveModel {
                id: ActiveValue::Set(task_id.clone()),
                sort_order: ActiveValue::Set(0),
                content: ActiveValue::Set(data.task.content),
                description: ActiveValue::Set(data.task.description),
                group_id: ActiveValue::Set(data.task.group_id),
                parent_id: match parent_id.clone() {
                    Some(pid) => ActiveValue::Set(Some(pid.clone())),
                    None => ActiveValue::Set(match data.task.parent_id {
                        Some(ref pids) => Some(pids.clone()),
                        None => None,
                    }),
                },
                created_at: ActiveValue::Set(Utc::now()),
                updated_at: ActiveValue::Set(Utc::now()),
                done_at: if let Some(done_at) = data.task.done_at {
                    ActiveValue::Set(Some(parse_datetime_string(&done_at)?))
                } else {
                    ActiveValue::NotSet
                },
                start_at: if let Some(start_at) = data.task.start_at {
                    ActiveValue::Set(Some(parse_datetime_string(&start_at)?))
                } else {
                    ActiveValue::NotSet
                },
                end_at: if let Some(end_at) = data.task.end_at {
                    ActiveValue::Set(Some(parse_datetime_string(&end_at)?))
                } else {
                    ActiveValue::NotSet
                },
                state: ActiveValue::Set(match data.task.state {
                    Some(s) => s,
                    None => TaskState::UNDONE,
                }),
                priority: if let Some(priority) = data.task.priority {
                    ActiveValue::Set(priority)
                } else {
                    ActiveValue::NotSet
                },
                factor: if let Some(factor) = data.task.factor {
                    ActiveValue::Set(factor)
                } else {
                    ActiveValue::NotSet
                },
                created_by_task_id: ActiveValue::Set(data.task.created_by_task_id),
                create_index: if let Some(create_index) = data.task.create_index {
                    ActiveValue::Set(create_index)
                } else {
                    ActiveValue::NotSet
                },
                target: ActiveValue::Set(data.task.target),
                target_type: ActiveValue::Set(data.task.target_type),

                ..Default::default()
            };
            let model = task::Entity::insert(active_model)
                .exec_with_returning(txn)
                .await
                .map_err(|err| err.to_string())?;
            if let Some(nt) = data.next_task {
                let active_model: next_task::ActiveModel = next_task::ActiveModel {
                    id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
                    mode: ActiveValue::Set(next_task::NextTaskMode::SIMPLE),
                    a: ActiveValue::Set(nt.a),
                    b: ActiveValue::Set(nt.b),
                    task_id: ActiveValue::Set(task_id.clone()),
                    created_at: ActiveValue::Set(Utc::now()),
                    updated_at: ActiveValue::Set(Utc::now()),
                    ..Default::default()
                };
                next_task::Entity::insert(active_model)
                    .exec_with_returning(txn)
                    .await
                    .map_err(|e| e.to_string())?;
            }
            all_results.push(model);

            if let Some(children) = data.children {
                let child_results = batch_create_tasks(txn, children, Some(task_id)).await?;
                all_results.extend(child_results);
            }
        }

        Ok(all_results)
    }
    .boxed()
}

pub async fn fill_task_with_default(
    txn: &impl ConnectionTrait,
    tasks: Vec<task::Model>,
) -> Result<Value, String> {
    let ids = tasks.iter().map(|t| t.id.clone()).collect::<Vec<String>>();
    let taks_view_tasks = task_view_task::Entity::find()
        .filter(task_view_task::Column::TaskId.is_in(ids.clone()))
        .all(txn)
        .await
        .map_err(|e| e.to_string())?;
    let next_tasks = next_task::Entity::find()
        .filter(next_task::Column::TaskId.is_in(ids))
        .all(txn)
        .await
        .map_err(|e| e.to_string())?;
    let mut results: Vec<Value> = vec![];
    for task in tasks {
        let related_view_tasks = taks_view_tasks
            .iter()
            .filter(|tvt| tvt.task_id == task.id)
            .cloned()
            .collect::<Vec<task_view_task::Model>>();
        let related_next_task = next_tasks.iter().find(|nt| nt.task_id == task.id).cloned();
        // 拼接
        let mut task_json = serde_json::to_value(&task).map_err(|e| e.to_string())?;
        if let serde_json::Value::Object(ref mut map) = task_json {
            map.insert(
                "task_view_tasks".to_string(),
                serde_json::to_value(&related_view_tasks).map_err(|e| e.to_string())?,
            );
            map.insert(
                "next_task".to_string(),
                serde_json::to_value(&related_next_task).map_err(|e| e.to_string())?,
            );
        }
        results.push(task_json)
    }
    Ok(serde_json::json!(results))
}

#[tauri::command]
pub async fn batch_edit_tasks(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    create: Vec<task::BatchCreateTaskModel>,
    update: Vec<task::UpdateModel>,
) -> Result<Value, String> {
    let db_guard = get_db_manage(db_manage).await?;
    let mut ret = db_guard
        .get_connection()
        .transaction::<_, BatchEditTasksResult, String>(|txn| {
            Box::pin(async move {
                // create
                // Promise.all
                let created = batch_create_tasks(txn, create, None).await?;
                // update
                // Promise.all
                let mut update_futures = Vec::new();
                for item in update {
                    if let Some(task_id) = &item.id.clone() {
                        let pk = task::Entity::find_by_id(task_id.clone());

                        let mut active_model = pk
                            .one(txn)
                            .await
                            .map_err(|err| err.to_string())?
                            .ok_or_else(|| DbErr::Custom("Task not found".to_string()))
                            .map_err(|err| err.to_string())?
                            .into_active_model();

                        update_task_by_active_model(
                            txn,
                            task_id.as_str(),
                            &mut active_model,
                            &item,
                        )
                        .await?;

                        update_futures.push(task::Entity::update(active_model).exec(txn));
                    }
                }
                let updated = futures::future::try_join_all(update_futures)
                    .await
                    .map_err(|err| err.to_string())?;
                Ok(BatchEditTasksResult { created, updated })
            })
        })
        .await
        .map_err(|e| e.to_string());
    // search all ret 's taskviewtasks
    let task_ids = ret
        .as_ref()
        .map_err(|e| e.to_string())?
        .created
        .iter()
        .chain(ret.as_ref().map_err(|e| e.to_string())?.updated.iter())
        .map(|task| task.id.clone())
        .collect::<Vec<String>>();
    // 根据task_ids 搜索taskViewTasks
    let task_view_tasks = task_view_task::Entity::find()
        .filter(task_view_task::Column::TaskId.is_in(task_ids.clone()))
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    // 根据task_ids 搜索nextTasks
    let _next_tasks = next_task::Entity::find()
        .filter(next_task::Column::TaskId.is_in(task_ids))
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;
    // 将taskViewTasks 拼接到ret 里,收集结果
    let mut creates: Vec<Value> = vec![];
    let mut updates: Vec<Value> = vec![];
    for task in ret.as_mut().map_err(|e| e.to_string())?.created.iter_mut() {
        let related_view_tasks = task_view_tasks
            .iter()
            .filter(|tvt| tvt.task_id == task.id)
            .cloned()
            .collect::<Vec<task_view_task::Model>>();
        let related_next_task = _next_tasks.iter().find(|nt| nt.task_id == task.id).cloned();
        // 拼接
        let mut task_json = serde_json::to_value(&task).map_err(|e| e.to_string())?;
        if let serde_json::Value::Object(ref mut map) = task_json {
            map.insert(
                "task_view_tasks".to_string(),
                serde_json::to_value(&related_view_tasks).map_err(|e| e.to_string())?,
            );
            map.insert(
                "next_task".to_string(),
                serde_json::to_value(&related_next_task).map_err(|e| e.to_string())?,
            );
        }
        creates.push(task_json)
    }
    for task in ret.as_mut().map_err(|e| e.to_string())?.updated.iter_mut() {
        let related_view_tasks = task_view_tasks
            .iter()
            .filter(|tvt| tvt.task_id == task.id)
            .cloned()
            .collect::<Vec<task_view_task::Model>>();
        let related_next_task = _next_tasks.iter().find(|nt| nt.task_id == task.id).cloned();
        // 拼接
        let mut task_json = serde_json::to_value(&task).map_err(|e| e.to_string())?;
        if let serde_json::Value::Object(ref mut map) = task_json {
            map.insert(
                "task_view_tasks".to_string(),
                serde_json::to_value(&related_view_tasks).map_err(|e| e.to_string())?,
            );
            map.insert(
                "next_task".to_string(),
                serde_json::to_value(&related_next_task).map_err(|e| e.to_string())?,
            );
        }
        updates.push(task_json)
    }

    let final_ret = serde_json::json!({
        "created": creates,
        "updated": updates,
    });
    let _ = broadcast_batch_upsert_tasks(&app_handle, creates, updates);
    Ok(final_ret)
}
