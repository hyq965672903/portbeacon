//! 4. 服务指纹：用安全的本地静态指纹和条件触发 HTTP 指纹补证据。

use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use crate::modules::analysis::model::{SourceKind, SourceRule};

static ACTIVE_FINGERPRINT_ENABLED: AtomicBool = AtomicBool::new(true);

/// 更新主动服务指纹开关。
pub fn set_active_fingerprint_enabled(enabled: bool) {
    ACTIVE_FINGERPRINT_ENABLED.store(enabled, Ordering::Relaxed);
}

/// 根据端口组合和来源补充稳定服务指纹，避免只靠端口号直接分类。
pub(crate) fn detect_service_fingerprint(port: u16, source: Option<&SourceRule>) -> Option<String> {
    let source = source?;

    if source.kind == SourceKind::AiAgent && ACTIVE_FINGERPRINT_ENABLED.load(Ordering::Relaxed) {
        return detect_local_http_fingerprint(port);
    }

    if matches!(source.display, "Docker" | "OrbStack") {
        return detect_well_known_service(port);
    }

    None
}

/// 根据高稳定性的常见服务端口补充数据库 / 中间件指纹。
///
/// 这些端口大多用于本地开发数据库或容器服务，哪怕 Docker Desktop 宿主进程被识别成应用本体，
/// 也仍然应该落入开发端口视图。
pub(crate) fn detect_well_known_service(port: u16) -> Option<String> {
    match port {
        3306 => Some("MySQL".to_string()),
        5432 => Some("PostgreSQL".to_string()),
        6379 => Some("Redis".to_string()),
        27017 => Some("MongoDB".to_string()),
        9200 | 9300 => Some("Elasticsearch".to_string()),
        5672 | 15672 => Some("RabbitMQ".to_string()),
        11211 => Some("Memcached".to_string()),
        _ => None,
    }
}

/// 对 AI Agent 本地端口做短超时 HTTP 指纹探测。
///
/// 只访问 127.0.0.1，且超时时间很短，避免后台刷新打扰用户服务。
fn detect_local_http_fingerprint(port: u16) -> Option<String> {
    let address = SocketAddr::from(([127, 0, 0, 1], port));
    let timeout = Duration::from_millis(120);
    let mut stream = TcpStream::connect_timeout(&address, timeout).ok()?;
    let _ = stream.set_read_timeout(Some(timeout));
    let _ = stream.set_write_timeout(Some(timeout));

    stream
        .write_all(b"HEAD / HTTP/1.0\r\nHost: 127.0.0.1\r\n\r\n")
        .ok()?;

    let mut buffer = [0_u8; 512];
    let size = stream.read(&mut buffer).ok()?;
    let response = String::from_utf8_lossy(&buffer[..size]).to_ascii_lowercase();

    response
        .starts_with("http/")
        .then(|| "HTTP service".to_string())
}
