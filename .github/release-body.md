## 更新日志

- 新增设置页「应用更新」模块：
  - 支持手动检查新版本。
  - 发现更新后展示版本号、发布日期和更新说明。
  - 支持用户确认后下载并安装更新。
  - 安装完成后提示重启应用。
- 接入 Tauri updater：
  - 新增 `@tauri-apps/plugin-updater` 和 `tauri-plugin-updater`。
  - 新增 updater capability 配置。
  - 配置 GitHub Release `latest.json` 作为更新源。
  - 开启 `createUpdaterArtifacts`，为自动更新生成签名产物。
- 调整 GitHub Release 打包流程：
  - 使用 `tauri-apps/tauri-action` 构建和发布多平台安装包。
  - 支持上传 updater `.sig` 签名文件。
  - 支持生成并上传 `latest.json`。
  - Release 说明继续读取 `.github/release-body.md`，并合并 GitHub 自动变更记录。
- 优化端口列表展示：
  - 默认尽量避免横向滚动。
  - 压缩表格列宽和按钮尺寸，在窗口较窄时尽量保留端口、服务、来源、运行时长、资源和操作信息。
  - 资源占用改为单行展示，长内容通过截断和提示保留可读性。
- 新增发布和自动更新方案文档，记录旧 CI/CD 流程与当前 `tauri-action` 流程的差异、配置步骤和常见问题。
- 调整版本号到 `0.3.0`。

## 下载说明

- macOS M 芯片：下载 `aarch64` 或 `universal` 的 `.dmg`。
- macOS Intel 芯片：优先下载 `x64` / `x86_64` 对应的 macOS 安装包。
- Windows：下载 `.msi` 或 `.exe`。
- Linux：下载 `.AppImage`、`.deb` 或 `.rpm`。

## 安装和兼容性说明

- macOS 首次打开如果出现系统安全提示，请在系统设置的隐私与安全中允许打开。
- Windows 如果出现 SmartScreen 提示，是因为当前版本还没有代码签名证书；确认来源后可以继续运行。
- Linux 如果使用 `.AppImage`，可能需要先赋予执行权限。

## 注意

- 停止进程是高风险操作。PortBeacon 会做基础保护，但仍建议先在详情中确认 PID、路径和进程链，再执行停止。
- 主动服务指纹只访问本机 localhost，并使用短超时；如不需要，可在系统设置中关闭。
- 应用内检查更新依赖 GitHub Release 中的 `latest.json` 和 `.sig`。如果发布流程尚未完成，设置页可能提示更新通道未准备好。
