# CI/CD 规范

## 1. 版本号命名规范

使用 SemVer：`major.minor.patch`。

```text
patch: 修复 bug (1.0.0 -> 1.0.1)
minor: 新功能 (1.0.0 -> 1.1.0)
major: 重大更新 (1.0.0 -> 2.0.0)
prerelease: 预发布版本 (1.0.0 -> 1.0.1-beta.0)
```

规则：

- 只修 bug，发 `patch`。
- 新增功能且向后兼容，发 `minor`。
- 有破坏性变更，发 `major`。
- 不确定稳定性，先发 `prerelease`。

Tag 使用 `v` 前缀：

```text
v1.0.0
v1.0.1
v1.1.0
v2.0.0
v1.1.0-beta.0
```

## 2. 更新日志模板

每次发布前，手动更新 `.github/release-body.md`。

推荐格式：

```md
## 更新日志

- 新增 ...
- 优化 ...
- 修复 ...
- 调整 ...

## 下载说明

- macOS M 芯片：下载 `aarch64` 的 `.dmg`。
- macOS Intel 芯片：下载 `x64` 的 `.app.zip`。
- Windows：下载 `.msi` 或 `.exe`。
- Linux：下载 `.AppImage`、`.deb` 或 `.rpm`。
```

写法要求：

- 先写用户能感知的变化，再写内部实现。
- 破坏性变更必须单独说明。
- 安装、权限、签名、兼容性问题必须写清楚。
- 不要把 commit message 直接堆进去。

## 3. 发版流程

1. 更新版本号。
2. 更新 `.github/release-body.md`。
3. 提交并推送代码。
4. 创建并推送 tag。
5. GitHub Actions 自动打包产物。
6. GitHub Actions 创建 Draft Release 并上传 Assets。
7. 检查 Release 内容和下载资源。
8. 确认无误后点击 `Publish release`。

示例：

```bash
git add .
git commit -m "chore: release v0.1.1"
git push

git tag v0.1.1
git push origin v0.1.1
```
