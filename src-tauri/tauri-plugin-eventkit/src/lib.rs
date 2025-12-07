use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Eventkit;
#[cfg(mobile)]
use mobile::Eventkit;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the eventkit APIs.
pub trait EventkitExt<R: Runtime> {
    fn eventkit(&self) -> &Eventkit<R>;
}

impl<R: Runtime, T: Manager<R>> crate::EventkitExt<R> for T {
    fn eventkit(&self) -> &Eventkit<R> {
        self.state::<Eventkit<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    println!("plugin init: eventkit-plugin");

    Builder::new("eventkit")
        .invoke_handler(tauri::generate_handler![commands::request_eventkit_access])
        .setup(|app, api| {
            #[cfg(mobile)]
            let eventkit = mobile::init(app, api)?;
            #[cfg(desktop)]
            let eventkit = desktop::init(app, api)?;
            app.manage(eventkit);
            Ok(())
        })
        .build()
}
