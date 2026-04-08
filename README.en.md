# PortBeacon

[简体中文](./README.md)

PortBeacon is a desktop port monitor for developers. It helps you inspect local port usage, identify the owning process, review port history, and stop a target process when needed.

## Screenshots

> Screenshots coming soon.

## Features

- Real-time port list: inspect ports, PIDs, process names, executable paths, uptime, and resource usage.
- Native port scanning: reads local port and process data through Rust instead of mock data.
- Process detail drawer: click a port row to inspect detailed process information.
- Process chain lookup: load the parent-child process chain on demand to understand where a port comes from.
- History records: stores port changes and manual actions with SQLite.
- Cross-platform desktop app: supports macOS, Windows, and Linux.

## Downloads

Download the latest version from GitHub Releases.

- macOS Apple Silicon: download the `aarch64` `.dmg`.
- macOS Intel: download the `x64` `.app.zip`.
- Windows: download the `.msi` or `.exe` installer.
- Linux: download the `.AppImage`, `.deb`, or `.rpm` package.

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the development app:

```bash
pnpm tauri dev
```

Build the frontend:

```bash
pnpm build
```

Build the desktop app:

```bash
pnpm tauri build
```

## Tech Stack

- Tauri 2
- Rust
- React 19
- TypeScript
- Tailwind CSS
- SQLite / rusqlite
- netstat2 / sysinfo

## Docs

- [CI/CD Guide](./docs/cicd.md)
- [Release Body Template](./.github/release-body.md)

## Safety Note

PortBeacon can stop local processes. Before stopping a process, verify its PID, executable path, and process chain to avoid stopping system processes or critical services by mistake.

## License

MIT
