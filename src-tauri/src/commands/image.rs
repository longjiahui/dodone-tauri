use crate::constants::{get_image_dir, IMAGE_PROTOCOL_NAME};
use chksum_md5;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn upload_images(
    app_handle: tauri::AppHandle,
    files: Vec<Vec<u8>>,
) -> Result<serde_json::Value, String> {
    // received images and md5 image and use md5 as filename save to image folder
    // return md5 s
    // let images: Vec<Vec<u8>> ;
    let mut md5s: Vec<String> = vec![];
    for file in files {
        let md5 = format!(
            "{:x}",
            chksum_md5::chksum(&file).map_err(|err| err.to_string())?
        );
        let image_path = get_image_dir(&app_handle);
        std::fs::create_dir_all(&image_path).map_err(|err| err.to_string())?;
        let image_file_path = image_path.join(md5.clone());
        std::fs::write(image_file_path, &file).map_err(|err| err.to_string())?;
        md5s.push(md5);
    }
    //  拼接 IMAGE_PROTOCOL_NAME://md5
    Ok(serde_json::json!(md5s
        .iter()
        .map(|md5| format!("image://{}", md5))
        .collect::<Vec<String>>()))
}

#[tauri::command]
pub fn open_image(app_handle: tauri::AppHandle, url: String) {
    // slice image://
    let path = url.trim_start_matches(format!("{}://", IMAGE_PROTOCOL_NAME).as_str());
    let image_path = get_image_dir(&app_handle).join(path);
    app_handle
        .opener()
        .open_path(image_path.to_string_lossy().to_string(), Some("Preview"))
        .unwrap();
}
