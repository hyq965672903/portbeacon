## 更新日志

- 新增 PortBeacon 主应用界面，支持仪表盘、端口列表、历史记录、系统设置和帮助视图切换。
- 新增托盘视图，主窗口和托盘窗口使用不同的轻量展示形态。
- 新增主题和语言偏好持久化，默认支持 `跟随系统 / 亮色 / 暗色` 与中英文切换。
- 优化右上角快捷操作：
  - 语言从下拉选择改为 `中 / EN` 直接切换。
  - 主题从下拉选择改为图标按钮循环切换。
- 端口列表补充搜索、筛选、自动刷新、关注端口和停止进程等操作。
- 历史记录支持筛选、搜索和自动刷新。
- 调整版本号到 `0.3.3`。

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
