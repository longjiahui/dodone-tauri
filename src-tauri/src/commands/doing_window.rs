use serde::Deserialize;
use std::sync::OnceLock;
use tauri::Manager;

// const winWidth = 240
// const winHeight = 72
// const winEdgeDistance = 48
const WIN_WIDTH: f64 = 240.0;
const WIN_HEIGHT: f64 = 72.0;
const WIN_EDGE_DISTANCE: f64 = 48.0;

fn get_width(monitor: &tauri::Monitor, w: f64) -> f64 {
    monitor.scale_factor() * w
}
fn get_height(monitor: &tauri::Monitor, h: f64) -> f64 {
    monitor.scale_factor() * h
}

const DOING_WINDOW_LABEL: &str = "doing";
static DOING_WINDOW: OnceLock<tauri::WebviewWindow> = OnceLock::new();

fn get_doing_window_position(
    app: &tauri::AppHandle,
    width: f64,
    _height: f64,
) -> Result<tauri::PhysicalPosition<f64>, String> {
    let monitor = app
        .primary_monitor()
        .map_err(|err| err.to_string())?
        .ok_or("Display not Found")?;
    let work_area = monitor.work_area();
    let screen_size = work_area.size;
    let x = screen_size.width as f64 - width - WIN_EDGE_DISTANCE;
    let y = f64::from(work_area.position.y) + WIN_EDGE_DISTANCE;
    Ok(tauri::PhysicalPosition::new(x, y))
}

static DOING_WINDOW_URL: &str = "/src/src-doing/index.html";

fn get_or_create_doing_window(app: &tauri::AppHandle) -> Result<&tauri::WebviewWindow, String> {
    let monitor = app
        .primary_monitor()
        .map_err(|err| err.to_string())?
        .unwrap();
    let w = get_width(&monitor, WIN_WIDTH);
    let h = get_height(&monitor, WIN_HEIGHT);
    Ok(DOING_WINDOW.get_or_init(|| {
        // let window = WebviewWindowBuilder::new(
        //     app,
        //     DOING_WINDOW_LABEL,
        //     tauri::WebviewUrl::App(DOING_WINDOW_URL.into()),
        // )
        // .build()
        // .expect("Failed To Init Doing Window");
        // let _ = window.set_always_on_top(true);
        // let _ = window.set_title_bar_style(tauri::TitleBarStyle::Overlay);
        // let _ = window.set_title("");
        let window = app
            .get_webview_window(DOING_WINDOW_LABEL)
            .expect("Failed to init doing window");
        let _ = window.set_size(tauri::PhysicalSize::new(w as u32, h as u32));
        let _ = window.set_position(
            get_doing_window_position(app, w, h)
                .unwrap_or(tauri::PhysicalPosition::<f64>::new(24.0, 24.0)),
        );
        let window_cloned = window.clone();
        window.on_window_event(move |e| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = e {
                api.prevent_close();
                let _ = window_cloned.hide();
            }
        });
        window
    }))
}

#[derive(Deserialize)]
pub struct SearchModel {
    task_id: Option<String>,
}

#[tauri::command]
pub fn open_doing_window(
    app_handle: tauri::AppHandle,
    search: Option<SearchModel>,
) -> Result<(), String> {
    let window = get_or_create_doing_window(&app_handle)?;
    //   const qs = taskId
    //     ? `?type=${"specific-task" satisfies DoingWindowType}&taskId=${taskId}`
    //     : `?type=${"auto-task-in-day" satisfies DoingWindowType}`
    //   if (viteDevServerURL) {
    //     win.loadURL(path.join(viteDevServerURL, doingWindowURL) + qs)
    //   } else {
    //     win.loadFile(path.join(renderedDistPath, doingWindowURL) + qs)
    //   }
    let qs = format!(
        "{}?type={}",
        DOING_WINDOW_URL,
        match search {
            Some(s) => match s.task_id {
                Some(id) => format!("specific-task&taskId={}", id),
                _ => "auto-task-in-day".to_string(),
            },
            None => "auto-task-in-day".to_string(),
        }
    );
    window
        .eval(format!("location.href='{}'", qs))
        .map_err(|err| err.to_string())?;
    window.show().map_err(|err| err.to_string())
}

#[tauri::command]
pub fn resize_doing_window(
    app_handle: tauri::AppHandle,
    width: f64,
    height: f64,
) -> Result<(), String> {
    // if (win) {
    //   const [originW, originH] = win.getSize()
    //   const w = Math.floor(width) || winWidth
    //   const h = Math.floor(height) || winHeight
    //   if (w > 0 && h > 0 && (w !== originW || h !== originH)) {
    //     win?.setSize(w, h)
    //     win.setBounds({
    //       width: w,
    //       height: h,
    //       y: winEdgeDistance,
    //       x:
    //         screen.getDisplayMatching(win.getBounds()).workAreaSize.width -
    //         w -
    //         winEdgeDistance,
    //     })
    //   }
    // }
    let window = get_or_create_doing_window(&app_handle)?;
    let monitor = window
        .current_monitor()
        .map_err(|err| err.to_string())?
        .ok_or("No monitor found")?;
    let w = get_width(&monitor, if width > 0.0 { width } else { WIN_WIDTH });
    let h = get_height(&monitor, if height > 0.0 { height } else { WIN_HEIGHT });
    window
        .set_size(tauri::PhysicalSize::new(w as u32, h as u32))
        .map_err(|err| err.to_string())
    // let screen_size = window
    //     .current_monitor()
    //     .map_err(|err| err.to_string())?
    //     .ok_or("No monitor found")?
    //     .work_area()
    //     .size;
    // let x = screen_size.width as f64 - w - WIN_EDGE_DISTANCE;
    // let y = WIN_EDGE_DISTANCE;
    // window
    //     .set_position(get_doing_window_position(&app_handle, w, h)?)
    //     .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn close_doing_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    let window = get_or_create_doing_window(&app_handle)?;
    window.close().map_err(|err| err.to_string())
}

// #[tauri::command]
// pub fn popup_doing_window_more_menu(app_handle: tauri::AppHandle) -> Result<(), String> {
//     let window = get_or_create_doing_window(&app_handle)?;
//     let menu = Menu::new(&app_handle).map_err(|e| e.to_string())?;
//     let item1 =
//         MenuItem::new(&app_handle, "Item 1", true, None::<&str>).map_err(|e| e.to_string())?;
//     menu.append(&item1).map_err(|e| e.to_string())?;
//     window.popup_menu(&menu).map_err(|err| err.to_string())
// }
