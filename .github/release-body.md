## 更新日志

- 修复 macOS Apple Silicon 检查更新时找不到平台项的问题：
  - `latest.json` 需要包含 `darwin-aarch64-app` / `darwin-aarch64`。
  - Apple Silicon 构建现在同时生成 `app` 和 `dmg`，避免只发布 `.dmg` 时缺少 updater 需要的平台记录。
- 调整版本号到 `0.3.1`。

## 下载说明

- macOS：
  - M 芯片：[下载 `.dmg`](https://github.com/hyq965672903/portbeacon/releases/download/__TAG_NAME__/portbeacon___VERSION___aarch64.dmg)
  - Intel 芯片：[下载 `.dmg`](https://github.com/hyq965672903/portbeacon/releases/download/__TAG_NAME__/portbeacon___VERSION___x64.dmg)
- Windows：[下载 `.exe`](https://github.com/hyq965672903/portbeacon/releases/download/__TAG_NAME__/portbeacon___VERSION___x64-setup.exe)
- Linux：
  - [下载 `.AppImage`](https://github.com/hyq965672903/portbeacon/releases/download/__TAG_NAME__/portbeacon___VERSION___amd64.AppImage)
  - [下载 `.deb`](https://github.com/hyq965672903/portbeacon/releases/download/__TAG_NAME__/portbeacon___VERSION___amd64.deb)
  - [下载 `.rpm`](https://github.com/hyq965672903/portbeacon/releases/download/__TAG_NAME__/portbeacon-__VERSION__-1.x86_64.rpm)

## 安装和兼容性说明

- macOS 首次打开如果出现系统安全提示，请在系统设置的隐私与安全中允许打开。
- Windows 如果出现 SmartScreen 提示，是因为当前版本还没有代码签名证书；确认来源后可以继续运行。
- Linux 如果使用 `.AppImage`，可能需要先赋予执行权限。
- `.app.tar.gz` 和 `.sig` 是自动更新使用的产物，不建议手动下载。

## 注意

- 停止进程是高风险操作。PortBeacon 会做基础保护，但仍建议先在详情中确认 PID、路径和进程链，再执行停止。
- 主动服务指纹只访问本机 localhost，并使用短超时；如不需要，可在系统设置中关闭。
- 应用内检查更新依赖 GitHub Release 中的 `latest.json` 和 `.sig`。如果发布流程尚未完成，设置页可能提示更新通道未准备好。
