## 更新日志

- 新增「开发端口 / 全部端口」视图，默认聚焦开发相关端口，系统服务、生活软件、浏览器后台和工具后台会默认折叠到全部端口中。
- 新增端口来源归因能力，可识别 IDE、AI Agent、AI IDE、Terminal、Docker / OrbStack 等来源，并区分直接来源和上游来源。
- 新增归因分析详情，端口详情中可查看归因摘要、进程链、置信度和判断依据。
- 新增服务指纹识别：
  - Docker / OrbStack 常见数据库端口可识别 MySQL、PostgreSQL、Redis、MongoDB 等服务。
  - AI Agent 来源端口支持短超时 localhost HTTP 指纹探测，不写死具体现场端口。
- 新增同一 PID 多端口收敛逻辑，减少 IDEA / Java 等场景下把业务端口和内部辅助端口同时展示为开发端口的问题。
- 新增端口关注能力，可在列表中标记端口，并使用「只看关注」筛选。
- 优化端口列表交互：
  - 去掉分页，改为滚动列表。
  - 列表单行展示端口、服务、来源、运行时长、资源和操作。
  - PID、完整路径、命令、进程链等详细信息移动到详情抽屉。
- 新增事件驱动自动刷新：
  - 后端端口变化时发送 `ports-updated`。
  - 前端静默刷新端口列表。
  - 详情打开时不会因为刷新被强制关闭。
  - 端口消失后保留最后快照并提示状态。
- 新增暂停 / 恢复自动刷新按钮。
- 新增端口采集间隔设置：2 秒、5 秒、10 秒。
- 新增主动服务指纹开关，可在系统设置中关闭主动探测。
- 新增归因修正规则管理：
  - 运行时规则文件：`portbeacon-rules.json`
  - 开发默认模板：`src-tauri/src/modules/analysis/portbeacon-rules.default.json`
  - 设置页支持新增、启用 / 禁用、删除端口修正规则。
- 新增历史记录视图和历史查询接口，支持查看 detected / released / replaced / stopped 等端口事件。
- 优化手动停止进程流程，停止后会同时刷新端口列表和历史记录。
- 优化后端归因缓存，避免同一 `protocol:port:pid` 在自动刷新中反复重算；用户规则变更后会清空缓存并触发刷新。
- 调整 Rust 后端目录结构：
  - `commands/`
  - `modules/analysis/`
  - `modules/port/`
  - `modules/history/`
  - `utils/`
- 调整端口、历史、归因相关模型命名，继续使用 QO / VO / PO 约定，并补充中文注释。
- 新增和完善文档：
  - 中文 README
  - 英文 README
  - CI/CD 规范文档
  - 归因分析设计文档
- 调整版本号到 `0.2.0`。

## 下载说明

- macOS M 芯片：下载 `aarch64` 或 `universal` 的 `.dmg`。
- macOS Intel 芯片：下载 `x64` 的 `.app.zip`。
- Windows：下载 `.msi` 或 `.exe`。
- Linux：下载 `.AppImage`、`.deb` 或 `.rpm`。

## 安装和兼容性说明

- macOS 首次打开如果出现系统安全提示，请在系统设置的隐私与安全中允许打开。
- Windows 如果出现 SmartScreen 提示，是因为当前版本还没有代码签名证书；确认来源后可以继续运行。
- Linux 如果使用 `.AppImage`，可能需要先赋予执行权限。

## 注意

- 停止进程是高风险操作。PortBeacon 会做基础保护，但仍建议先在详情中确认 PID、路径和进程链，再执行停止。
- 主动服务指纹只访问本机 localhost，并使用短超时；如不需要，可在系统设置中关闭。
