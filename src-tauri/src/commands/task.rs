use std::vec;

use chrono::Utc;
use futures::{future::BoxFuture, FutureExt};
use sea_orm::{
    ActiveValue, ColumnTrait, ConnectionTrait, DbErr, EntityTrait, IntoActiveModel, LoaderTrait,
    QueryFilter, TransactionTrait,
};
use serde_json::Value;
use uuid::Uuid;

use crate::{
    database::{get_db_manage, DbState},
    entities::{
        next_task,
        prelude::Task,
        task::{self, BatchEditTasksResult},
        task_target_record, task_view_task,
    },
    utils::{
        datetime::parse_datetime_string,
        event::{
            broadcast_batch_upsert_tasks, broadcast_delete_task, broadcast_delete_task_view_tasks,
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
    let result: Vec<_> = tasks
        .into_iter()
        .zip(next_tasks.into_iter())
        .zip(task_view_tasks.into_iter())
        .map(|((task, next_task), view_tasks)| {
            let mut task_json = serde_json::to_value(&task).unwrap();
            if let serde_json::Value::Object(ref mut map) = task_json {
                map.insert(
                    "taskViewTasks".to_string(),
                    serde_json::to_value(&view_tasks).unwrap(),
                );
                map.insert(
                    "nextTask".to_string(),
                    serde_json::to_value(&next_task).unwrap(),
                );
            }
            task_json
        })
        .collect();
    Ok(result)
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
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        content: ActiveValue::Set(data.content),
        description: ActiveValue::Set(data.description),
        group_id: ActiveValue::Set(Uuid::parse_str(&data.group_id).map_err(|err| err.to_string())?),
        parent_id: if let Some(parent_id) = data.parent_id {
            ActiveValue::Set(Some(
                Uuid::parse_str(&parent_id).map_err(|err| err.to_string())?,
            ))
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
        BatchEditTasksResult {
            created: vec![res.clone()],
            updated: vec![],
        },
    );
    serde_json::to_value(res).map_err(|e| e.to_string())
}

async fn update_task_by_active_model<C>(
    connection: &C,
    id: Uuid,
    model: &mut task::ActiveModel,
    data: task::UpdateModel,
) -> Result<(), String>
where
    C: ConnectionTrait,
{
    if let Some(sort_order) = data.sort_order {
        model.sort_order = ActiveValue::Set(sort_order);
    }
    if let Some(group_id) = data.group_id {
        model.group_id =
            ActiveValue::Set(Uuid::parse_str(&group_id).map_err(|err| err.to_string())?)
    } else {
        model.group_id = ActiveValue::NotSet
    };
    if let Some(content) = data.content {
        model.content = ActiveValue::Set(content);
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
                    let task_model = task::Entity::find_by_id(
                        uuid::Uuid::parse_str(&cpid).map_err(|e| e.to_string())?,
                    )
                    .one(connection)
                    .await
                    .map_err(|e| e.to_string())?
                    .ok_or_else(|| "Task not found during parent ID check".to_string())?;
                    current_id = task_model.parent_id.map(|id| id.to_string());
                }
            }
        }

        model.parent_id = if let Some(parent_id) = data.parent_id.as_option() {
            ActiveValue::Set(Some(
                Uuid::parse_str(&parent_id).map_err(|err| err.to_string())?,
            ))
        } else {
            ActiveValue::Set(None)
        };
    }
    if data.state != Option3::Undefined {
        model.state = ActiveValue::Set(if let Some(st) = data.state.as_option() {
            Some(st.clone())
        } else {
            None
        });
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
            ActiveValue::Set(Some(
                Uuid::parse_str(&cbtid).map_err(|err| err.to_string())?,
            ))
        } else {
            ActiveValue::Set(None)
        };
    }
    if let Some(create_index) = data.create_index {
        model.create_index = ActiveValue::Set(create_index);
    }
    if data.target != Option3::Undefined {
        model.target = ActiveValue::Set(if let Some(tgt) = data.target.as_option() {
            Some(tgt.clone())
        } else {
            None
        });
        if data.target == Option3::Null {
            // 删除所有目标records
            let _ = task_target_record::Entity::delete_many()
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
    Ok(())
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
    let pk = task::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let mut active_model = pk
        .one(db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Task not found".to_string())?
        .into_active_model();

    update_task_by_active_model(
        db,
        uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?,
        &mut active_model,
        data,
    )
    .await?;
    let res = task::Entity::update(active_model)
        .exec(db)
        .await
        .map_err(|e| e.to_string())?;

    // search for taskviewtasks
    let task_view_tasks = task_view_task::Entity::find()
        .filter(task_view_task::Column::TaskId.eq(res.id))
        .all(db)
        .await
        .map_err(|e| e.to_string())?;

    // 拼接数据并返回
    // serde_json::to_value(res).map_err(|e| e.to_string())
    let mut task_json = serde_json::to_value(&res).unwrap();
    if let serde_json::Value::Object(ref mut map) = task_json {
        map.insert(
            "task_view_tasks".to_string(),
            serde_json::to_value(&task_view_tasks).unwrap(),
        );
    }

    let mut result_json = serde_json::to_value(&BatchEditTasksResult {
        created: vec![],
        updated: vec![],
    })
    .unwrap();
    if let serde_json::Value::Object(ref mut map) = result_json {
        map.insert(
            "updated".to_string(),
            serde_json::Value::Array(vec![serde_json::to_value(&res).unwrap()]),
        );
    }
    let _ = broadcast_batch_upsert_tasks(
        &app_handle,
        result_json,
        // BatchEditTasksResult {
        //     created: vec![],
        //     updated: vec![serde_json::to_value(&res).unwrap()],
        // },
    );
    Ok(task_json)
}

#[tauri::command]
pub async fn delete_task_by_id(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let db_guard = get_db_manage(db_manage).await?;
    let pk = task::Entity::find_by_id(uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?);
    let deleted_task = pk
        .one(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Task not found".to_string())?;

    // 拼接关联的taskviewtasks
    let deleted_task_view_tasks = task_view_task::Entity::find()
        .filter(task_view_task::Column::TaskId.eq(deleted_task.id))
        .all(db_guard.get_connection())
        .await
        .map_err(|e| e.to_string())?;

    let mut deleted_task_json = serde_json::to_value(&deleted_task).unwrap();
    if let serde_json::Value::Object(ref mut map) = deleted_task_json {
        map.insert(
            "task_view_tasks".to_string(),
            serde_json::to_value(&deleted_task_view_tasks).unwrap(),
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
    parent_id: Option<Uuid>,
) -> BoxFuture<'a, Result<Vec<task::Model>, String>> {
    async move {
        let mut all_results = Vec::new();
        for data in create {
            let task_id = uuid::Uuid::new_v4();

            let active_model = task::ActiveModel {
                id: ActiveValue::Set(task_id),
                sort_order: ActiveValue::Set(0),
                content: ActiveValue::Set(data.task.content),
                description: ActiveValue::Set(data.task.description),
                group_id: ActiveValue::Set(
                    Uuid::parse_str(&data.task.group_id).map_err(|err| err.to_string())?,
                ),
                parent_id: match parent_id {
                    Some(pid) => ActiveValue::Set(Some(pid)),
                    None => ActiveValue::Set(match data.task.parent_id {
                        Some(ref pids) => {
                            Some(Uuid::parse_str(&pids).map_err(|err| err.to_string())?)
                        }
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
                state: ActiveValue::Set(data.task.state),
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
                created_by_task_id: if let Some(cbtid) = data.task.created_by_task_id {
                    ActiveValue::Set(Some(
                        Uuid::parse_str(&cbtid).map_err(|err| err.to_string())?,
                    ))
                } else {
                    ActiveValue::NotSet
                },
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
                    id: ActiveValue::Set(uuid::Uuid::new_v4()),
                    mode: ActiveValue::Set(next_task::NextTaskMode::SIMPLE),
                    a: ActiveValue::Set(nt.a),
                    b: ActiveValue::Set(nt.b),
                    task_id: ActiveValue::Set(task_id),
                    created_at: ActiveValue::Set(Utc::now()),
                    updated_at: ActiveValue::Set(Utc::now()),
                    ..Default::default()
                };
                let res = next_task::Entity::insert(active_model)
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
                    if let Some(id) = &item.id {
                        let task_id = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
                        let pk = task::Entity::find_by_id(task_id);

                        let mut active_model = pk
                            .one(txn)
                            .await
                            .map_err(|err| err.to_string())?
                            .ok_or_else(|| DbErr::Custom("Task not found".to_string()))
                            .map_err(|err| err.to_string())?
                            .into_active_model();

                        update_task_by_active_model(txn, task_id, &mut active_model, item).await?;

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
        .map(|task| task.id)
        .collect::<Vec<Uuid>>();
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
    let _ = broadcast_batch_upsert_tasks(&app_handle, &final_ret);
    Ok(final_ret)
}
