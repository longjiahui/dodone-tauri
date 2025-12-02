pub use sea_orm_migration::prelude::*;

mod constant;
mod initial_entities;
mod m20220101_000001_create_table;
mod m20251202_053342_v1_1;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20251202_053342_v1_1::Migration),
        ]
    }
}
