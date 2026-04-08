use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter};

use crate::modules::history::model::HistoryEventPO;
use crate::modules::history::service::insert_history_event;
use crate::modules::port::model::PortSnapshot;
use crate::modules::port::scanner::scan_port_snapshots;

const MONITOR_INTERVAL: Duration = Duration::from_secs(2);
static MONITOR_STARTED: AtomicBool = AtomicBool::new(false);

/// 启动后台端口监控，用于记录端口生命周期变化。
pub fn start_port_monitor(app: AppHandle) {
    if MONITOR_STARTED.swap(true, Ordering::SeqCst) {
        return;
    }

    thread::spawn(move || {
        let mut previous = match scan_port_snapshots() {
            Ok(snapshots) => snapshots,
            Err(error) => {
                let _ = insert_history_event(&HistoryEventPO::monitor_error(error));
                HashMap::new()
            }
        };

        loop {
            thread::sleep(MONITOR_INTERVAL);

            let current = match scan_port_snapshots() {
                Ok(snapshots) => snapshots,
                Err(error) => {
                    let _ = insert_history_event(&HistoryEventPO::monitor_error(error));
                    let _ = app.emit("history-updated", ());
                    continue;
                }
            };

            let events = diff_snapshots(&previous, &current);
            if !events.is_empty() {
                for event in events {
                    let _ = insert_history_event(&event);
                }
                let _ = app.emit("history-updated", ());
            }

            previous = current;
        }
    });
}

/// 对比两次端口快照，并为变化生成历史事件。
fn diff_snapshots(
    previous: &HashMap<String, PortSnapshot>,
    current: &HashMap<String, PortSnapshot>,
) -> Vec<HistoryEventPO> {
    let mut events = Vec::new();

    for (key, snapshot) in current {
        match previous.get(key) {
            None => events.push(HistoryEventPO::from_snapshot(
                "detected",
                snapshot,
                "Port observed",
            )),
            Some(previous_snapshot) if previous_snapshot.pid != snapshot.pid => {
                events.push(HistoryEventPO::from_snapshot(
                    "replaced",
                    snapshot,
                    "Port owner changed",
                ));
            }
            Some(_) => {}
        }
    }

    for (key, snapshot) in previous {
        if !current.contains_key(key) {
            events.push(HistoryEventPO::from_snapshot(
                "released",
                snapshot,
                "Port disappeared",
            ));
        }
    }

    events
}
