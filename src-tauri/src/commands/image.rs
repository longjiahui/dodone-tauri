use crate::constants::{get_image_dir, get_image_protocol_path};
use chksum_md5;
use file_format::FileFormat;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn upload_images(
    app_handle: tauri::AppHandle,
    files: Vec<Vec<u8>>,
) -> Result<serde_json::Value, String> {
    // received images and md5 image and use md5 as filename save to image folder
    // return md5 s
    // let images: Vec<Vec<u8>> ;
    let mut image_file_names: Vec<String> = vec![];
    for file in files {
        let fmt = FileFormat::from_bytes(&file);
        if !fmt.media_type().starts_with("image/") {
            return Err("File is not an image".into());
        }
        let ext = fmt.extension();
        let md5 = format!(
            "{:x}",
            chksum_md5::chksum(&file).map_err(|err| err.to_string())?
        );
        let image_path = get_image_dir(&app_handle);
        std::fs::create_dir_all(&image_path).map_err(|err| err.to_string())?;
        let file_name = format!("{}.{}", md5, ext);
        let image_file_path = image_path.join(&file_name);
        std::fs::write(&image_file_path, &file).map_err(|err| err.to_string())?;
        image_file_names.push(file_name);
    }
    //  拼接 IMAGE_PROTOCOL_NAME://md5
    Ok(serde_json::json!(image_file_names
        .iter()
        .map(|file| get_image_protocol_path(file))
        .collect::<Vec<String>>()))
}

#[tauri::command]
pub fn open_image(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    let image_path = get_image_dir(&app_handle)
        .join(url.as_str())
        .to_string_lossy()
        .to_string();
    println!("Opening image path: {}", image_path);
    app_handle
        .opener()
        .open_path(image_path, None::<String>)
        .map_err(|err| err.to_string())?;
    Ok(())
}
