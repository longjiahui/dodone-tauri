use tauri::{command, AppHandle, Runtime};

// use crate::models::*;
use crate::EventkitExt;
use crate::Result;

#[command]
pub(crate) async fn request_eventkit_access<R: Runtime>(app: AppHandle<R>) -> Result<()> {
    app.eventkit().request_eventkit_access()
}
