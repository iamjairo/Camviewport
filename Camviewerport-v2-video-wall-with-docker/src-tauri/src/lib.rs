use tauri::Manager;

/// Called from the Tauri window to resolve the backend base URLs.
/// Reads from environment or falls back to defaults for LAN use.
#[tauri::command]
fn get_backend_urls() -> serde_json::Value {
    serde_json::json!({
        "go2rtc":   std::env::var("GO2RTC_BASE_URL").unwrap_or_else(|_| "http://localhost:1984".into()),
        "mediamtx": std::env::var("MEDIAMTX_BASE_URL").unwrap_or_else(|_| "http://localhost:8888".into()),
    })
}

/// Open a native file dialog to import a camera list JSON file.
#[tauri::command]
async fn pick_camera_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app
        .dialog()
        .file()
        .add_filter("Camera list", &["json"])
        .blocking_pick_file();
    match path {
        Some(p) => Ok(Some(p.to_string())),
        None => Ok(None),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![get_backend_urls, pick_camera_file])
        .setup(|app| {
            // Inject backend URLs into the web context as window.__GO2RTC_BASE__ etc.
            let win = app.get_webview_window("main").unwrap();
            let go2rtc_url = std::env::var("GO2RTC_BASE_URL")
                .unwrap_or_else(|_| "http://localhost:1984".into());
            let mediamtx_url = std::env::var("MEDIAMTX_BASE_URL")
                .unwrap_or_else(|_| "http://localhost:8888".into());

            let _ = win.eval(&format!(
                "window.__GO2RTC_BASE__ = '{}'; window.__MEDIAMTX_BASE__ = '{}';",
                go2rtc_url, mediamtx_url
            ));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
