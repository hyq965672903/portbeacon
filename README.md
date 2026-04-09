# PortBeacon

[English](./README.en.md)

PortBeacon 是一个面向开发者的桌面端口监控工具。它可以快速查看本机端口占用、定位进程来源、追踪端口历史，并在必要时停止目标进程。

## 截图

> Screenshots coming soon.

## 核心功能

- 实时端口列表：查看端口、PID、进程名、路径、运行时长和资源占用。
- 原生端口扫描：通过 Rust 获取本机端口与进程数据，不依赖 mock 数据。
- 进程详情抽屉：点击端口行查看更完整的进程信息。
- 进程链追踪：按需加载父子进程链，帮助判断端口来源。
- 历史记录：使用 SQLite 保存端口变化和手动操作记录。
- 跨平台桌面端：支持 macOS、Windows 和 Linux。

## 下载

请前往 GitHub Releases 下载最新版本。

- macOS Apple Silicon：下载 `aarch64` 的 `.dmg`。
- macOS Intel：下载 `x64` / `x86_64` 的 `.dmg`。
- Windows：优先下载 `.exe` 安装包。
- Linux：优先下载 `.AppImage`，也可以按发行版选择 `.deb` 或 `.rpm`。

自动更新会额外使用 `.app.tar.gz`、`.sig` 和 `latest.json` 等产物，这些文件不是给用户手动安装的。

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm tauri dev
```

构建前端：

```bash
pnpm build
```

构建桌面应用：

```bash
pnpm tauri build
```

## 技术栈

- Tauri 2
- Rust
- React 19
- TypeScript
- Tailwind CSS
- SQLite / rusqlite
- netstat2 / sysinfo

## 文档

- [CI/CD 规范](./docs/cicd.md)
- [自动更新与发布方案](./docs/自动更新与发布方案.md)
- [Release Body 模板](./.github/release-body.md)

## 安全提示

PortBeacon 支持停止本机进程。执行停止前，请先确认 PID、路径和进程链，避免误停系统进程或关键服务。

## License

MIT
