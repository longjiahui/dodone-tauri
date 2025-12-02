use sea_orm_migration::{prelude::*, schema::*};

use crate::constant::{
    NTC_REPEAT_CONTENT, NTC_REPEAT_DESCRIPTION, NTC_REPEAT_TIMES, NT_TABLE_NAME,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(NT_TABLE_NAME)
                    .add_column_if_not_exists(ColumnDef::new(NTC_REPEAT_TIMES).integer().null())
                    .to_owned(),
            )
            .await?;
        manager
            .alter_table(
                Table::alter()
                    .table(NT_TABLE_NAME)
                    .add_column_if_not_exists(ColumnDef::new(NTC_REPEAT_CONTENT).text().null())
                    .to_owned(),
            )
            .await?;
        manager
            .alter_table(
                Table::alter()
                    .table(NT_TABLE_NAME)
                    .add_column_if_not_exists(ColumnDef::new(NTC_REPEAT_DESCRIPTION).text().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        manager
            .alter_table(
                Table::alter()
                    .table(NT_TABLE_NAME)
                    .drop_column(NTC_REPEAT_TIMES)
                    .drop_column(NTC_REPEAT_CONTENT)
                    .drop_column(NTC_REPEAT_DESCRIPTION)
                    .to_owned(),
            )
            .await
    }
}
