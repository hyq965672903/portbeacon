use std::time::{SystemTime, UNIX_EPOCH};

/// 返回当前 Unix 时间戳，单位为毫秒。
pub fn timestamp_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or_default()
}
