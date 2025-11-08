use std::sync::Arc;

use futures::lock::Mutex;
use tauri::Manager;

use crate::database::{init_database, DbState};

mod database;
mod entities;

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app: &mut tauri::App| {
            let handle = app.handle().clone();

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
            commands::task_group::get_task_groups,
            commands::task_group::create_task_group,
            commands::task_group::update_task_group_by_id,
            commands::task_group::delete_task_group_by_id,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
