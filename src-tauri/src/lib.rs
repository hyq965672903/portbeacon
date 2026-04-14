mod commands;
mod modules;
mod utils;

use commands::history_command::list_history;
use commands::port_command::{
    delete_port_rule, get_process_tree, kill_process, list_port_rules, list_ports, save_port_rule,
    set_port_analysis_config, set_port_monitor_config,
};
use modules::analysis::init_feedback_rules;
use modules::history::service::init_history_database;
use modules::port::monitor::start_port_monitor;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
    AppHandle, Manager, PhysicalPosition, Position, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};

const TRAY_WINDOW_LABEL: &str = "tray";
const TRAY_WINDOW_WIDTH: f64 = 360.0;
const TRAY_WINDOW_HEIGHT: f64 = 520.0;
const TRAY_WINDOW_MARGIN_TOP: i32 = 28;
const TRAY_WINDOW_MARGIN_RIGHT: i32 = 16;

fn load_tray_icon() -> Image<'static> {
    Image::from_bytes(include_bytes!("../icons/icon.png")).expect("failed to load tray icon")
}

#[tauri::command]
fn show_main_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    let _ = window.unminimize();
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_tray_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(TRAY_WINDOW_LABEL) {
        window.hide().map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn ensure_tray_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    if let Some(window) = app.get_webview_window(TRAY_WINDOW_LABEL) {
        return Ok(window);
    }

    let window = WebviewWindowBuilder::new(
        app,
        TRAY_WINDOW_LABEL,
        WebviewUrl::App("index.html?mode=tray".into()),
    )
    .title("PortBeacon Tray")
    .inner_size(TRAY_WINDOW_WIDTH, TRAY_WINDOW_HEIGHT)
    .min_inner_size(TRAY_WINDOW_WIDTH, TRAY_WINDOW_HEIGHT)
    .max_inner_size(TRAY_WINDOW_WIDTH, TRAY_WINDOW_HEIGHT)
    .resizable(false)
    .maximizable(false)
    .minimizable(false)
    .closable(false)
    .visible(false)
    .decorations(false)
    .shadow(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .focused(true)
    .build()?;

    let app_handle = app.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            if let Some(window) = app_handle.get_webview_window(TRAY_WINDOW_LABEL) {
                let _ = window.hide();
            }
        }
    });

    Ok(window)
}

fn position_tray_window(window: &WebviewWindow) -> tauri::Result<()> {
    let Some(monitor) = window.current_monitor()? else {
        return Ok(());
    };

    let monitor_position = monitor.position();
    let monitor_size = monitor.size();
    let window_size = window.outer_size()?;
    let x = monitor_position.x + monitor_size.width as i32
        - window_size.width as i32
        - TRAY_WINDOW_MARGIN_RIGHT;
    let y = monitor_position.y + TRAY_WINDOW_MARGIN_TOP;

    window.set_position(Position::Physical(PhysicalPosition::new(x, y)))
}

fn toggle_tray_window(app: &AppHandle) -> tauri::Result<()> {
    let window = ensure_tray_window(app)?;

    if window.is_visible()? {
        window.hide()?;
        return Ok(());
    }

    position_tray_window(&window)?;
    window.show()?;
    window.set_focus()?;
    Ok(())
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, "open", "Open PortBeacon", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_item, &quit_item])?;
    let icon = load_tray_icon();

    let builder = TrayIconBuilder::with_id("menu-bar")
        .icon(icon)
        .tooltip("PortBeacon")
        .title("PortBeacon")
        .icon_as_template(false)
        .show_menu_on_left_click(false)
        .menu(&menu)
        .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
            "open" => {
                let _ = show_main_window(app.clone());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray: &tauri::tray::TrayIcon, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let _ = toggle_tray_window(&tray.app_handle().clone());
            }
        });

    let tray = builder.build(app)?;
    app.manage(tray);
    ensure_tray_window(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            init_feedback_rules(app_handle.clone()).expect("failed to initialize feedback rules");
            init_history_database(app_handle.clone())
                .expect("failed to initialize history database");
            start_port_monitor(app_handle);
            setup_tray(app.handle()).expect("failed to initialize tray");

            if let Some(main_window) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(window) = handle.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_ports,
            get_process_tree,
            kill_process,
            set_port_monitor_config,
            set_port_analysis_config,
            list_port_rules,
            save_port_rule,
            delete_port_rule,
            list_history,
            show_main_window,
            hide_tray_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
