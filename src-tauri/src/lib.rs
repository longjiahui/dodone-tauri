use std::sync::Arc;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

use crate::{
    constants::{
        get_app_data_dir, get_database_dir, get_image_dir, get_image_protocol_path,
        get_public_resource, IMAGE_PROTOCOL_NAME,
    },
    database::{init_database, make_db_state, DbState},
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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app: &mut tauri::App| {
            let open_primary_window_i = MenuItem::with_id(
                app,
                "open_primary_window",
                "Open Primary Window",
                true,
                None::<&str>,
            )?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_primary_window_i, &quit_i])?;
            let tray = TrayIconBuilder::new()
                .tooltip(app.package_info().name.clone())
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "open_primary_window" => {
                        if let Some(window) = app.get_webview_window(DEFAULT_PRIMARY_WINDOW_LABEL) {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.unminimize();
                        }
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
                })
                .show_menu_on_left_click(true)
                .build(app)?;

            let handle = app.handle().clone();

            // log all directorires
            let app_data_dir = get_app_data_dir(&handle);
            let database_dir = get_database_dir(&handle);
            let image_dir = get_image_dir(&handle);
            println!("App data directory: {:?}", app_data_dir);
            println!("Database directory: {:?}", database_dir);
            println!("Image directory: {:?}", image_dir);

            // debug模式下将main窗口移动到某个display
            // #[cfg(debug_assertions)]
            // {
            //     // In debug mode, try to move the main window to a secondary display (common setups
            //     // place a second monitor at an x offset like 2560). This is best-effort and errors
            //     // are ignored so it won't crash the app if the API isn't available or the position
            //     // is invalid.

            //     if let Some(window) = app.get_webview_window(DEFAULT_PRIMARY_WINDOW_LABEL) {
            //         if let Some(monitor) = app.available_monitors().unwrap().get(1) {
            //             let _ = window.set_position(tauri::Position::Physical(
            //                 monitor.work_area().position.clone(),
            //             ));
            //         }
            //     }
            // }

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

                        handle.manage(make_db_state(Some(db_manage)));
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
            commands::task_group::get_task_group_by_id,
            commands::task_group::create_task_group,
            commands::task_group::update_task_group_by_id,
            commands::task_group::delete_task_group_by_id,
            commands::task_group::change_task_group_orders,
            // task commands
            commands::task::get_tasks,
            commands::task::get_task_by_id,
            commands::task::create_task,
            commands::task::update_task_by_id,
            commands::task::delete_task_by_id,
            commands::task::batch_edit_tasks,
            // next task commands
            commands::next_task::get_next_tasks,
            commands::next_task::create_next_task,
            commands::next_task::update_next_task_by_id,
            commands::next_task::delete_next_task_by_id,
            // task target record commands
            commands::task_target_record::get_task_target_records,
            commands::task_target_record::create_task_target_record,
            commands::task_target_record::update_task_target_record_by_id,
            commands::task_target_record::delete_task_target_record_by_id,
            // task view commands
            commands::task_view::get_task_views,
            commands::task_view::create_task_view,
            commands::task_view::update_task_view_by_id,
            commands::task_view::delete_task_view_by_id,
            commands::task_view::change_task_view_orders,
            // task anchor commands
            commands::task_anchor::get_task_anchors,
            commands::task_anchor::create_task_anchor,
            commands::task_anchor::delete_task_anchor_by_id,
            commands::task_anchor::change_task_anchor_orders,
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
            //  const commands
            commands::constants::get_const,
            commands::constants::set_const,
            commands::constants::get_image_protocol_name,
            // database commands
            commands::database::get_current_db_name,
            commands::database::get_databases,
            commands::database::create_database,
            commands::database::delete_database,
            commands::database::switch_database,
            // window commands
            commands::window::get_window_size,
            commands::window::set_window_size,
            // doing window commands
            commands::doing_window::open_doing_window,
            commands::doing_window::resize_doing_window,
            commands::doing_window::close_doing_window,
            // commands::doing_window::popup_doing_window_more_menu,
            // biz util commands
            commands::biz_util::rest_a_day,
        ])
        .register_uri_scheme_protocol(IMAGE_PROTOCOL_NAME, move |app, request| {
            // Inside the register_uri_scheme_protocol handler:
            let uri = request.uri().to_string();
            let path: &str;
            #[cfg(target_os = "windows")]
            {
                path = uri.trim_start_matches(&format!("{}://localhost/", IMAGE_PROTOCOL_NAME));
            }
            #[cfg(target_os = "macos")]
            {
                // Extract the path from the URI
                path = uri.trim_start_matches(&format!("{}://", IMAGE_PROTOCOL_NAME));
            }
            let image_path = get_image_dir(&app.app_handle()).join(if path.ends_with("/") {
                path[..path.len() - 1].to_string()
            } else {
                path.to_string()
            });
            println!(
                "Serving image from path: {:?} (path: {:?})",
                image_path, path
            );
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
                    println!("Error reading file {}: {}", image_path.display(), e);
                    let image_404_path_result =
                        get_public_resource(&app.app_handle(), "image/image-not-found.png");
                    if let Ok(image_404_path) = image_404_path_result {
                        println!("404 image path: {:?}", image_404_path);
                        // tauri::http::Response::builder()
                        //     .status(404)
                        //     .body(Vec::new())
                        //     .unwrap()
                        match std::fs::read(&image_404_path) {
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
                    } else {
                        println!(
                            "Failed to get 404 image resource: {:?}",
                            image_404_path_result
                        );
                        tauri::http::Response::builder()
                            .status(404)
                            .body(Vec::new())
                            .unwrap()
                    }
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, event| {
            // reopen 是为了实现点击 Dock 图标时显示主窗口的功能，只有macos编译
            #[cfg(target_os = "macos")]
            {
                if let tauri::RunEvent::Reopen {
                    has_visible_windows,
                    ..
                } = event
                {
                    // Create or show a window as necessary
                    if !has_visible_windows {
                        if let Some(window) = _app.get_webview_window(DEFAULT_PRIMARY_WINDOW_LABEL)
                        {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.unminimize();
                        }
                    }
                }
            }
        });
}
