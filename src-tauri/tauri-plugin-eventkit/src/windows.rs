use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::Error;

// use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<Eventkit<R>> {
    Ok(Eventkit(app.clone()))
}

/// Access to the eventkit APIs.
pub struct Eventkit<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Eventkit<R> {
    pub fn request_eventkit_access(&self) -> crate::Result<()> {
        // let _ = self.0.run_on_main_thread(|| unsafe {
        //     let _ = request_eventkit_access();
        // });
        // Ok(())
        Err(Error::PlatformNotSupported("windows not supported".into()))
    }
}
