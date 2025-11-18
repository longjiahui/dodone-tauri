use sea_orm_migration::prelude::*;

use crate::initial_entities::{
    next_task, notification, task, task_anchor, task_group, task_in_day, task_target_record,
    task_view, task_view_task,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        let db = manager.get_connection();
        db.get_schema_builder()
            .register(task::Entity)
            .register(next_task::Entity)
            .register(notification::Entity)
            .register(task_anchor::Entity)
            .register(task_group::Entity)
            .register(task_in_day::Entity)
            .register(task_target_record::Entity)
            .register(task_view_task::Entity)
            .register(task_view::Entity)
            .apply(db)
            .await?;
        let task_start_end_at_idx: IndexCreateStatement = Index::create()
            .name("task_start_end_at_idx")
            .table(task::Entity)
            .col(task::Column::StartAt)
            .col(task::Column::EndAt)
            .col(task::Column::State)
            .take();
        let task_in_day_date_start_end_at_idx: IndexCreateStatement = Index::create()
            .name("task_in_day_date_start_end_at_idx")
            .table(task_in_day::Entity)
            .col(task_in_day::Column::StartTime)
            .col(task_in_day::Column::EndTime)
            .col(task_in_day::Column::Date)
            .take();
        let _ = db.execute(&task_start_end_at_idx).await?;
        let _ = db.execute(&task_in_day_date_start_end_at_idx).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        manager
            .drop_table(Table::drop().table("Task").to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table("TaskView").to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table("TaskViewTask").to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table("TaskTargetRecord").to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table("TaskInDay").to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table("TaskGroup").to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table("TaskAnchor").to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table("Notification").to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table("NextTask").to_owned())
            .await?;
        Ok(())
    }
}
