use std::sync::Arc;

use futures::lock::Mutex;
use tauri::Manager;

use crate::{
    constants::{get_database_dir, get_user_data_dir},
    database::{init_database, DbState},
};

mod constants;
mod database;
mod entities;
mod utils;

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app: &mut tauri::App| {
            let handle = app.handle().clone();

            // log all directorires
            let user_data_dir = get_user_data_dir(&handle);
            let database_dir = get_database_dir(&handle);
            println!("User data directory: {:?}", user_data_dir);
            println!("Database directory: {:?}", database_dir);

            // Initialize database in async context
            tauri::async_runtime::spawn(async move {
                match init_database(&handle).await {
                    Ok(db_manage) => {
                        // TODO: Run migrations when needed
                        // if let Err(e) = Migrator::up(db_manager.get_connection(), None).await {
                        //     eprintln!("Failed to run migrations: {}", e);
                        // } else {
                        //     println!("Database migrations completed successfully");
                        // }

                        let db_state: DbState = Arc::new(Mutex::new(db_manage));
                        handle.manage(db_state);
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                    }
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // task group commands
            commands::task_group::get_task_groups,
            commands::task_group::create_task_group,
            commands::task_group::update_task_group_by_id,
            commands::task_group::delete_task_group_by_id,
            // task commands
            commands::task::get_tasks,
            commands::task::create_task,
            commands::task::update_task_by_id,
            commands::task::delete_task_by_id,
            commands::task::batch_edit_tasks,
            // next task commands
            commands::next_task::get_next_tasks,
            commands::next_task::create_next_task,
            commands::next_task::update_next_task_by_id,
            commands::next_task::delete_next_task_by_id,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
