use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;

use rusqlite::{params, Connection};
use tauri::{AppHandle, Manager};

use crate::models::{HistoryEntry, HistoryListRequest};
use crate::time::timestamp_ms;

const HISTORY_LIMIT: usize = 600;
static HISTORY_DB_PATH: OnceLock<PathBuf> = OnceLock::new();

pub fn init_history_database(app: AppHandle) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data directory: {error}"))?;
    fs::create_dir_all(&data_dir)
        .map_err(|error| format!("failed to create app data directory: {error}"))?;

    let db_path = data_dir.join("portbeacon.sqlite3");
    let _ = HISTORY_DB_PATH.set(db_path);
    let connection = history_connection()?;
    migrate_history_database(&connection)?;

    Ok(())
}

pub fn insert_history_event(event: &HistoryEntry) -> Result<(), String> {
    let connection = history_connection()?;
    connection
        .execute(
            "
            INSERT OR REPLACE INTO history_events (
              id,
              timestamp,
              port,
              protocol,
              pid,
              process_name,
              action,
              source,
              result,
              location,
              reason,
              error
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            ",
            params![
                event.id,
                event.timestamp,
                event.port,
                event.protocol,
                event.pid,
                event.process_name,
                event.action,
                event.source,
                event.result,
                event.location,
                event.reason,
                event.error,
            ],
        )
        .map_err(|error| format!("failed to insert history event: {error}"))?;
    prune_history_events(&connection)
}

pub fn query_history(request: HistoryListRequest) -> Result<Vec<HistoryEntry>, String> {
    let connection = history_connection()?;
    let limit = request.limit.unwrap_or(200).clamp(1, HISTORY_LIMIT) as i64;
    let now = timestamp_ms();
    let min_timestamp = match request.range.as_deref() {
        Some("1h") => now.saturating_sub(60 * 60 * 1000),
        Some("24h") => now.saturating_sub(24 * 60 * 60 * 1000),
        Some("7d") => now.saturating_sub(7 * 24 * 60 * 60 * 1000),
        _ => 0,
    };
    let search = request.search.unwrap_or_default().trim().to_lowercase();
    let action = request.action.unwrap_or_else(|| "all".to_string());

    let mut statement = connection
        .prepare(
            "
            SELECT id, timestamp, port, protocol, pid, process_name, action, source, result, location, reason, error
            FROM history_events
            WHERE timestamp >= ?1
              AND (?2 = 'all' OR action = ?2)
              AND (?3 IS NULL OR port = ?3)
              AND (
                ?4 = ''
                OR lower(process_name || ' ' || location || ' ' || protocol || ' ' || action || ' ' || source || ' ' || ifnull(pid, '') || ' ' || port) LIKE '%' || ?4 || '%'
              )
            ORDER BY timestamp DESC
            LIMIT ?5
            ",
        )
        .map_err(|error| format!("failed to prepare history query: {error}"))?;

    let rows = statement
        .query_map(
            params![min_timestamp, action, request.port, search, limit],
            |row| {
                Ok(HistoryEntry {
                    id: row.get(0)?,
                    timestamp: row.get(1)?,
                    port: row.get(2)?,
                    protocol: row.get(3)?,
                    pid: row.get(4)?,
                    process_name: row.get(5)?,
                    action: row.get(6)?,
                    source: row.get(7)?,
                    result: row.get(8)?,
                    location: row.get(9)?,
                    reason: row.get(10)?,
                    error: row.get(11)?,
                })
            },
        )
        .map_err(|error| format!("failed to query history events: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("failed to read history events: {error}"))
}

fn history_connection() -> Result<Connection, String> {
    let db_path = HISTORY_DB_PATH
        .get()
        .ok_or_else(|| "history database is not initialized".to_string())?;
    Connection::open(db_path).map_err(|error| format!("failed to open history database: {error}"))
}

fn migrate_history_database(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS history_events (
              id TEXT PRIMARY KEY,
              timestamp INTEGER NOT NULL,
              port INTEGER NOT NULL,
              protocol TEXT NOT NULL,
              pid INTEGER,
              process_name TEXT NOT NULL,
              action TEXT NOT NULL,
              source TEXT NOT NULL,
              result TEXT NOT NULL,
              location TEXT NOT NULL,
              reason TEXT,
              error TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_history_events_timestamp
              ON history_events(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_history_events_port
              ON history_events(port, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_history_events_action
              ON history_events(action, timestamp DESC);
            ",
        )
        .map_err(|error| format!("failed to migrate history database: {error}"))
}

fn prune_history_events(connection: &Connection) -> Result<(), String> {
    connection
        .execute(
            "
            DELETE FROM history_events
            WHERE id NOT IN (
              SELECT id FROM history_events
              ORDER BY timestamp DESC
              LIMIT ?1
            )
            ",
            params![HISTORY_LIMIT as i64],
        )
        .map_err(|error| format!("failed to prune history events: {error}"))?;
    Ok(())
}
