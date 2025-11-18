use futures::TryFutureExt;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, Condition, EntityTrait, QueryFilter,
    TransactionTrait,
};

use crate::{
    commands,
    database::{get_db_manage, DbState},
    entities::{
        task::{self, TaskState},
        task_in_day,
    },
    utils::{
        datetime::parse_datetime_string,
        event::{broadcast_batch_upsert_tasks, broadcast_update_task_in_days},
    },
};

#[derive(Debug, Clone)]
struct RestADayResult {
    tasks: Vec<task::Model>,
    task_in_days: Vec<task_in_day::Model>,
}

#[tauri::command]
pub async fn rest_a_day(
    app_handle: tauri::AppHandle,
    db_manage: tauri::State<'_, DbState>,
    date: String,
) -> Result<(), String> {
    // startof day
    let date_value = parse_datetime_string(date.as_str())?;
    let db = get_db_manage(db_manage).await?;
    let conn = db.get_connection();
    let result: RestADayResult = conn
        .transaction::<_, RestADayResult, String>(|txn| {
            Box::pin(async move {
                // 查找未来未完成的任务
                let tasks = task::Entity::find()
                    .filter(
                        Condition::all()
                            .add(task::Column::StartAt.gte(date_value))
                            .add(Condition::any().add(task::Column::State.eq(TaskState::UNDONE))),
                    )
                    .all(txn)
                    .map_err(|err| err.to_string())
                    .await?;
                // 查找startAt 和endAt之间包含date的任务
                let during_tasks = task::Entity::find()
                    .filter(
                        Condition::all()
                            .add(task::Column::StartAt.lte(date_value))
                            .add(task::Column::EndAt.gte(date_value))
                            .add(Condition::any().add(task::Column::State.eq(TaskState::UNDONE))),
                    )
                    .all(txn)
                    .map_err(|e| e.to_string())
                    .await?;
                // 更新任务的开始时间和结束时间
                let mut updated_tasks: Vec<task::Model> = vec![];
                // duration tasks 只加结束
                // future tasks 都加开始和结束
                for task in during_tasks {
                    let new_end_at = task.end_at.map(|end_at| end_at + chrono::Duration::days(1));
                    let updated_task = task::ActiveModel {
                        id: ActiveValue::Set(task.id),
                        end_at: ActiveValue::Set(new_end_at),
                        ..Default::default()
                    };
                    updated_tasks.push(updated_task.update(txn).await.map_err(|e| e.to_string())?);
                }
                for task in tasks {
                    let new_start_at = task
                        .start_at
                        .map(|start_at| start_at + chrono::Duration::days(1));
                    let new_end_at = task.end_at.map(|end_at| end_at + chrono::Duration::days(1));
                    let updated_task = task::ActiveModel {
                        id: ActiveValue::Set(task.id),
                        start_at: ActiveValue::Set(new_start_at),
                        end_at: ActiveValue::Set(new_end_at),
                        ..Default::default()
                    };
                    updated_tasks.push(updated_task.update(txn).await.map_err(|e| e.to_string())?);
                }

                // 查找今天 + 未来的taskInDay 未完成
                let task_in_days = task_in_day::Entity::find()
                    .left_join(task::Entity)
                    .filter(
                        Condition::all()
                            .add(task_in_day::Column::Date.gte(date_value))
                            .add(Condition::any().add(task::Column::State.eq(TaskState::UNDONE))),
                    )
                    .all(txn)
                    .map_err(|e| e.to_string())
                    .await?;
                let mut task_in_days_new: Vec<task_in_day::Model> = vec![];
                for task_in_day in task_in_days {
                    let new_date = task_in_day.date + chrono::Duration::days(1);
                    let updated_task_in_day = task_in_day::ActiveModel {
                        id: ActiveValue::Set(task_in_day.id),
                        date: ActiveValue::Set(new_date),
                        ..Default::default()
                    };
                    task_in_days_new.push(
                        updated_task_in_day
                            .update(txn)
                            .await
                            .map_err(|e| e.to_string())?,
                    );
                }
                Ok(RestADayResult {
                    tasks: updated_tasks,
                    task_in_days: task_in_days_new,
                })
            })
        })
        .await
        .map_err(|e| e.to_string())?;
    let _ = broadcast_batch_upsert_tasks(
        &app_handle,
        Vec::<task::Model>::new(),
        commands::task::fill_task_with_default(conn, result.tasks).await?,
    );
    let _ = broadcast_update_task_in_days(&app_handle, result.task_in_days);
    Ok(())
}
