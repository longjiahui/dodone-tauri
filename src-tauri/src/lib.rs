use std::sync::Arc;

use futures::lock::Mutex;
use tauri::Manager;

use crate::{
    constants::{get_app_data_dir, get_database_dir, get_image_dir, IMAGE_PROTOCOL_NAME},
    database::{init_database, DbState},
};

mod constants;
mod database;
mod entities;
mod utils;

mod commands;

const DEFAULT_PRIMARY_WINDOW_LABEL: &str = "main";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app: &mut tauri::App| {
            let handle = app.handle().clone();

            // log all directorires
            let app_data_dir = get_app_data_dir(&handle);
            let database_dir = get_database_dir(&handle);
            let image_dir = get_image_dir(&handle);
            println!("App data directory: {:?}", app_data_dir);
            println!("Database directory: {:?}", database_dir);
            println!("Image directory: {:?}", image_dir);

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
            let app_handle = app.handle();
            if let Some(window) = app_handle.get_webview_window(DEFAULT_PRIMARY_WINDOW_LABEL) {
                let window_clone = window.clone();
                window.on_window_event(move |e| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = e {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }
            Ok(())
        })
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
            // task view commands
            commands::task_view::get_task_views,
            commands::task_view::create_task_view,
            commands::task_view::update_task_view_by_id,
            commands::task_view::delete_task_view_by_id,
            // task anchor commands
            commands::task_anchor::get_task_anchors,
            commands::task_anchor::create_task_anchor,
            commands::task_anchor::delete_task_anchor_by_id,
            // task view task commands
            commands::task_view_task::get_task_view_tasks,
            commands::task_view_task::create_task_view_task,
            commands::task_view_task::delete_task_view_task_by_id,
            // task in day commands
            commands::task_in_day::get_task_in_days,
            commands::task_in_day::create_task_in_day,
            commands::task_in_day::update_task_in_day_by_id,
            commands::task_in_day::delete_task_in_day_by_id,
            // image commands
            commands::image::upload_images,
            commands::image::open_image,
            // notification commands
            commands::notification::get_notifications,
            commands::notification::delete_notification_by_id,
        ])
        .register_uri_scheme_protocol(IMAGE_PROTOCOL_NAME, move |app, request| {
            // Inside the register_uri_scheme_protocol handler:
            let uri = request.uri().to_string();
            let path = uri.trim_start_matches(&format!("{}://", IMAGE_PROTOCOL_NAME)); // Extract the path from the URI
            let image_path =
                get_image_dir(&app.app_handle()).join(path[..path.len() - 1].to_string());
            match std::fs::read(&image_path) {
                Ok(data) => {
                    // Determine the MIME type based on the file extension
                    let mime = "image/*";
                    tauri::http::Response::builder()
                        .header("Content-Length", data.len())
                        .header("Content-Type", mime)
                        .status(200)
                        .body(data)
                        .unwrap()
                }
                Err(e) => {
                    println!("Error reading file {}: {}", path, e);
                    tauri::http::Response::builder()
                        .status(404)
                        .body(Vec::new())
                        .unwrap()
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, event| {
            if let tauri::RunEvent::Reopen {
                has_visible_windows,
                ..
            } = event
            {
                // Create or show a window as necessary
                if !has_visible_windows {
                    if let Some(window) = _app.get_webview_window(DEFAULT_PRIMARY_WINDOW_LABEL) {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.unminimize();
                    }
                }
            }
        });
}
