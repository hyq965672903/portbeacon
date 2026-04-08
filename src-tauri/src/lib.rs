mod commands;
mod modules;
mod utils;

use commands::history_command::list_history;
use commands::port_command::{get_process_tree, kill_process, list_ports};
use modules::history::service::init_history_database;
use modules::port::monitor::start_port_monitor;

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
