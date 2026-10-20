# Tag 自动打包与发布

工作流位于 [`.github/workflows/release.yml`](../.github/workflows/release.yml)。仓库名建议为 `transmission-cove`；镜像地址会自动从实际 GitHub 仓库路径生成，不需要把用户名写入工作流。

触发条件是推送 `v*` Tag。发布版本以 Tag 为准，例如 `v0.0.1` 或 `v0.2.0-rc.1`；构建前自动同步 `package.json`、`package-lock.json` 顶层及根包的版本，无需提前手动更新。不接受缺少 `v`、前导零或 `+build` 元数据。

同步仅修改 Actions 检出的构建文件，不创建提交、不回写分支或移动 Tag。静态包和 Docker 作业都会执行同步，因此安装包名称、界面底栏版本与镜像版本一致；依赖版本保持锁定。

工作流依次执行：

1. 校验 Tag 并同步构建版本，拒绝覆盖已经发布的同版本 Release。
2. 安装锁定依赖，运行单元/代理测试、发布脚本测试及 Linux 安装脚本测试，执行 TypeScript 与 Vite 生产构建。
3. 生成 `transmission-cove-<版本>-web.zip`、`transmission-cove-<版本>-web.tar.gz`、`install.sh` 和覆盖这些文件的 `SHA256SUMS`。两个安装包的根目录直接包含 `index.html` 和 `assets/`，用于原生 Web 覆盖安装。
4. 构建 linux/amd64 与 linux/arm64 镜像，推送到 `ghcr.io/<所有者>/<仓库>`；提供 `v0.1.0` 和 `0.1.0` 两种版本标签，不自动覆盖 `latest`。
5. 在镜像成功后上传安装包及脚本并发布 GitHub Release；带 `-rc.1` 等后缀时标记为预发布。先写草稿再发布，失败遗留草稿可继续；稳定版设为 GitHub Latest Release，供一键脚本发现，预发布不设为 Latest。发布旧版本补丁时需留意 Latest 指向，可在 Release 页面调整。镜像依然使用明确版本 Tag，没有 `latest` 镜像标签。

只使用仓库自带的 `GITHUB_TOKEN`，权限按作业限制为读取源码、写 Packages 或写 Release。GitHub Actions 和 Packages 必须获仓库/组织策略允许；没有要求配置 PAT。

将源码（含工作流）提交并推送到你的 GitHub 仓库后，首次版本可执行：

```bash
git tag -a v0.1.0 -m "Transmission Cove 0.1.0"
git push origin v0.1.0
```

后续版本将需要发布的代码提交并推送，然后打 Tag，例如：

```bash
git push origin HEAD
git tag -a v0.2.0 -m "Transmission Cove 0.2.0"
git push origin v0.2.0
```

预发布使用 `v0.2.0-rc.1`。失败可在 Actions 重跑作业，或在主分支已有工作流后使用 **Run workflow** 输入原 Tag。手动运行仍检出指定 Tag，不会将主分支最新代码包装成旧版本；若 Tag 中的代码需要修改，应创建新版本。旧 Tag 如果指向加入版本同步功能之前的提交，单纯重跑仍会使用旧脚本；需先提交此修复，再在修复后的提交上创建新 Tag。

本地也可生成相同静态包（Linux/macOS 需要 `zip` 和 `tar`；Windows 使用系统 `tar.exe`）：

```bash
export RELEASE_TAG=v0.1.0
node scripts/release-meta.mjs --sync
npm ci
npm test
npm run test:release
npm run build
npm run release:package
```

PowerShell 将第一行改为以下设置，再依次运行其余命令：

```powershell
$env:RELEASE_TAG = 'v0.1.0'
```

本地 `--sync` 会修改两个版本文件；不带此参数只校验，安装包脚本也保持严格校验，避免构建后才改变版本导致包名与页面内容不一致。必须先同步，再构建和打包。

校验安装包：Linux 使用 `sha256sum -c SHA256SUMS`，macOS 使用 `shasum -a 256 -c SHA256SUMS`；Windows 使用 `Get-FileHash` 并与 `SHA256SUMS` 对照。发布步骤使用 [GitHub CLI Release 命令](https://cli.github.com/manual/gh_release_create)，Docker 构建使用 [Docker 官方 Action](https://github.com/docker/build-push-action)。

[返回产品主页](../README.md) · [部署指南](DEPLOYMENT.md)
