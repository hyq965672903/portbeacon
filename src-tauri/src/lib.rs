mod commands;
mod core;

use commands::ports::{get_process_tree, kill_process, list_history, list_ports};
use core::history::init_history_database;
use core::monitor::start_port_monitor;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            init_history_database(app_handle.clone())
                .expect("failed to initialize history database");
            start_port_monitor(app_handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_ports,
            get_process_tree,
            kill_process,
            list_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
