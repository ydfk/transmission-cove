# Tag 自动打包与发布

工作流位于 [`.github/workflows/release.yml`](../.github/workflows/release.yml)。仓库名建议为 `transmission-cove`；镜像地址会自动从实际 GitHub 仓库路径生成，不需要把用户名写入工作流。

触发条件是推送 `v*` Tag。版本必须与 `package.json`、`package-lock.json` 完全一致，例如 `v0.1.0` 或 `v0.2.0-rc.1`；不接受缺少 `v`、版本错配、前导零或 `+build` 元数据。

工作流依次执行：

1. 校验版本，拒绝覆盖已经发布的同版本 Release。
2. 安装锁定依赖，运行单元/代理测试及发布脚本测试，执行 TypeScript 与 Vite 生产构建。
3. 生成 `transmission-cove-<版本>-web.zip`、`transmission-cove-<版本>-web.tar.gz` 和 `SHA256SUMS`。两个安装包的根目录直接包含 `index.html` 和 `assets/`，用于原生 Web 覆盖安装。
4. 构建 linux/amd64 与 linux/arm64 镜像，推送到 `ghcr.io/<所有者>/<仓库>`；提供 `v0.1.0` 和 `0.1.0` 两种版本标签，不自动覆盖 `latest`。
5. 在镜像成功后上传安装包并发布 GitHub Release；带 `-rc.1` 等后缀时标记为预发布。先写草稿再发布，失败遗留草稿可继续；工作流不会自动指定 GitHub 的 Latest Release。

只使用仓库自带的 `GITHUB_TOKEN`，权限按作业限制为读取源码、写 Packages 或写 Release。GitHub Actions 和 Packages 必须获仓库/组织策略允许；没有要求配置 PAT。

将源码（含工作流）提交并推送到你的 GitHub 仓库后，首次版本可执行：

```bash
git tag -a v0.1.0 -m "Transmission Cove 0.1.0"
git push origin v0.1.0
```

后续版本先更新两个版本文件，再提交并打 Tag，例如：

```bash
npm version 0.2.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release v0.2.0"
git push origin HEAD
git tag -a v0.2.0 -m "Transmission Cove 0.2.0"
git push origin v0.2.0
```

预发布将版本替换为 `0.2.0-rc.1`。失败可在 Actions 重跑作业，或在主分支已有工作流后使用 **Run workflow** 输入原 Tag。手动运行仍检出指定 Tag，不会将主分支最新代码包装成旧版本；若 Tag 中的代码需要修改，应创建新版本。

本地也可生成相同静态包（Linux/macOS 需要 `zip` 和 `tar`；Windows 使用系统 `tar.exe`）：

```bash
npm ci
npm test
npm run test:release
npm run build
RELEASE_TAG=v0.1.0 npm run release:package
```

PowerShell 最后一行改为：

```powershell
$env:RELEASE_TAG = 'v0.1.0'
npm run release:package
```

校验安装包：Linux 使用 `sha256sum -c SHA256SUMS`，macOS 使用 `shasum -a 256 -c SHA256SUMS`；Windows 使用 `Get-FileHash` 并与 `SHA256SUMS` 对照。发布步骤使用 [GitHub CLI Release 命令](https://cli.github.com/manual/gh_release_create)，Docker 构建使用 [Docker 官方 Action](https://github.com/docker/build-push-action)。

[返回产品主页](../README.md) · [部署指南](DEPLOYMENT.md)
