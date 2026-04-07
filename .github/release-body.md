## PortBeacon

PortBeacon 是一个桌面端口监控工具，用来快速查看本机端口占用、定位进程来源，并在需要时安全停止目标进程。

## 本次版本重点

- 实时端口列表：展示端口、PID、进程名、路径、运行时长和资源占用。
- 进程详情：点击端口行查看进程信息和父子进程链。
- 历史记录：后台监控端口变化，并按端口聚合展示历史事件。
- 跨平台打包：提供 macOS、Windows 和 Linux 桌面安装包。

## 下载建议

- macOS M 芯片：下载 `aarch64` 或 `universal` 的 `.dmg`。
- macOS Intel 芯片：下载 `x64` 的 `.app.zip`，解压后把应用拖到 Applications。
- Windows：下载 `.msi` 或 `.exe` 安装包。
- Linux：优先下载 `.AppImage`，也可以按发行版选择 `.deb` 或 `.rpm`。

## 安装说明

- macOS 首次打开如果出现系统安全提示，请在系统设置的隐私与安全中允许打开。
- Windows 如果出现 SmartScreen 提示，是因为当前版本还没有代码签名证书；确认来源后可以继续运行。
- Linux 如果使用 `.AppImage`，可能需要先赋予执行权限。

## 注意

停止进程是高风险操作。PortBeacon 会做基础保护，但仍建议先在详情中确认 PID、路径和进程链，再执行停止。
