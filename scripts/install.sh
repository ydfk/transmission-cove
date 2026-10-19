#!/bin/sh
# 仅安装 Web 界面；不修改 daemon 配置、种子或下载数据。
set -eu

REPO=ydfk/transmission-cove
mode=native
version=latest
web_dir=
restore=
port=8080
rpc=http://127.0.0.1:9091/transmission/rpc
yes=false
work=
stage=
lock=
backup=
swapping=false
docker_new=false
docker_old=
docker_was_running=false
name=transmission-cove

die() { printf '错误：%s\n' "$*" >&2; exit 1; }
help() {
  cat <<'EOF'
Transmission Cove 安装 / 更新
  sh install.sh [--mode native|docker] [--version v1.2.3] [--yes]
  sh install.sh --web-dir /已确认的/web [--version v1.2.3]
  sh install.sh --web-dir /已确认的/web --restore /对应的/web.cove-backup-时间
  sh install.sh --mode docker [--port 8080] [--name transmission-cove] [--rpc-url http://127.0.0.1:9091/transmission/rpc]

默认：native、GitHub 最新稳定版本、识别常见目录、执行前确认。
native 需要 curl、tar、sha256sum 和现有 Web 目录的写权限。
docker 适用于 Linux NAS，使用 host 网络，仅管理带 Cove 安装标记的同名容器。
更新时再次执行同一命令；native 自动保留备份，Docker 更新保留旧容器。
EOF
}
while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h) help; exit 0 ;;
    --yes) yes=true; shift ;;
    --mode|--version|--web-dir|--restore|--port|--rpc-url|--name)
      [ "$#" -ge 2 ] || die "$1 缺少参数"
      case "$1" in
        --mode) mode=$2 ;; --version) version=$2 ;; --web-dir) web_dir=$2 ;;
        --restore) restore=$2 ;; --port) port=$2 ;; --rpc-url) rpc=$2 ;; --name) name=$2 ;;
      esac
      shift 2 ;;
    *) die "未知参数：$1（使用 --help）" ;;
  esac
done
case "$mode" in native|docker) ;; *) die 'mode 必须为 native 或 docker' ;; esac
[ "$mode" = native ] || [ -z "$restore$web_dir" ] || die 'Docker 模式不接受 Web 目录或文件回退参数'

cleanup() {
  result=$?
  trap - EXIT HUP INT TERM
  if [ "$swapping" = true ] && [ ! -e "$web_dir" ] && [ -d "$backup" ]; then
    mv "$backup" "$web_dir" || printf '请手动恢复备份：%s\n' "$backup" >&2
  fi
  if [ "$result" -ne 0 ]; then
    if [ "$docker_new" = true ]; then docker rm -f "$name" >/dev/null 2>&1 || true; fi
    if [ -n "$docker_old" ]; then
      docker rename "$docker_old" "$name" || true
      if [ "$docker_was_running" = true ]; then docker start "$name" >/dev/null || true; fi
    fi
  fi
  [ -z "$stage" ] || rm -rf "$stage"
  [ -z "$lock" ] || rmdir "$lock" || true
  [ -z "$work" ] || rm -rf "$work"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' HUP INT TERM
confirm() {
  [ "$yes" = true ] && return
  printf '继续安装？[y/N] '
  read -r answer || die '无交互终端，请下载脚本后运行或明确添加 --yes'
  case "$answer" in y|Y|yes) ;; *) die '已取消，未修改安装目录或容器' ;; esac
}
download() {
  curl --fail --location --silent --show-error --proto '=https' --proto-redir '=https' --connect-timeout 20 --max-time 300 --retry 2 "$1" -o "$2" || die '下载失败。请检查 GitHub 网络和版本是否已发布；不会使用未校验的文件'
}
resolve_version() {
  command -v curl >/dev/null || die '需要 curl，请先在 NAS 上安装'
  if [ "$version" = latest ]; then
    download "https://api.github.com/repos/$REPO/releases/latest" "$work/release.json"
    version=$(sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$work/release.json" | head -n 1)
  fi
  printf '%s\n' "$version" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z]+([.-][0-9A-Za-z]+)*)?$' || die '版本应为 v1.2.3 或 v1.2.3-rc.1；请确认已有稳定 Release，或使用 --version 指定版本'
}
work=$(mktemp -d "${TMPDIR:-/tmp}/transmission-cove.XXXXXX")

if [ "$mode" = docker ]; then
  [ "$(uname -s)" = Linux ] || die 'Docker 一键模式使用 host 网络，仅适用于 Linux / NAS'
  command -v docker >/dev/null || die '需要 Docker / 群晖 Container Manager'
  case "$name" in ''|[!a-zA-Z0-9]*|*[!a-zA-Z0-9_.-]*) die '容器名称必须以字母或数字开头，仅包含字母、数字、点、下划线和连字符' ;; esac
  case "$port" in ''|*[!0-9]*) die 'port 必须为数字' ;; esac
  if [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then die 'port 必须为 1024–65535'; fi
  case "$rpc" in http://*|https://*) ;; *) die 'RPC 地址需要 http:// 或 https://' ;; esac
  case "$rpc" in *@*|*\#*) die 'RPC 地址不得包含凭据或锚点' ;; esac
  docker info >/dev/null 2>&1 || die '无法访问 Docker，请确认服务和当前用户权限'
  mkdir "${TMPDIR:-/tmp}/$name.cove-docker.lock" 2>/dev/null || die 'Docker 安装正在进行，或安装锁尚未清理'
  lock="${TMPDIR:-/tmp}/$name.cove-docker.lock"
  resolve_version
  image="ghcr.io/$REPO:$version"
  printf '部署 %s，host 网络端口 %s。默认连接同机 Transmission。\n' "$image" "$port"
  confirm
  if docker inspect "$name" >/dev/null 2>&1; then
    [ "$(docker inspect -f '{{index .Config.Labels "io.transmission-cove.installer"}}' "$name")" = true ] || die '同名容器不是由此脚本创建，请先自行处理或改名'
  fi
  docker pull "$image" || die '镜像拉取失败；确认版本已发布、GHCR 包为 Public，且支持本机架构'
  if docker inspect "$name" >/dev/null 2>&1; then
    docker_was_running=$(docker inspect -f '{{.State.Running}}' "$name")
    old_name="$name-backup-$(date +%Y%m%d-%H%M%S)-$$"
    # 先改名再停止，失败时 trap 可恢复原名称和运行状态。
    docker rename "$name" "$old_name"
    docker_old=$old_name
    docker stop "$old_name" >/dev/null
  fi
  docker create --name "$name" --label io.transmission-cove.installer=true \
    --network host --restart unless-stopped --read-only --cap-drop ALL \
    --security-opt no-new-privileges:true -e "PORT=$port" -e "TRANSMISSION_RPC_URL=$rpc" \
    --health-cmd 'node -e "fetch(`http://127.0.0.1:${process.env.PORT}/`).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"' \
    "$image" >/dev/null
  docker_new=true
  docker start "$name" >/dev/null
  attempt=0
  until docker exec "$name" node -e 'fetch(`http://127.0.0.1:${process.env.PORT}/`).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))' >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    [ "$attempt" -lt 15 ] || die '新容器启动检查失败，正在恢复旧容器'
    sleep 1
  done
  printf '已安装 %s。访问 http://NAS地址:%s；界面可访问不代表 RPC 已连通。\n' "$version" "$port"
  [ -z "$docker_old" ] || printf '旧容器保留为 %s（已停止）。回退步骤见部署指南。\n' "$docker_old"
  exit 0
fi

if [ -z "$web_dir" ]; then
  for candidate in /var/packages/[Tt]ransmission/target/share/transmission/web /var/packages/[Tt]ransmission/target/share/transmission/public_html /usr/share/transmission/web /usr/local/share/transmission/web; do
    [ -f "$candidate/index.html" ] || continue
    resolved=$(cd "$candidate" && pwd -P)
    if [ -n "$web_dir" ] && [ "$web_dir" != "$resolved" ]; then die '找到多个 Web 目录，请使用 --web-dir 明确指定'; fi
    web_dir=$resolved
  done
fi
[ -n "$web_dir" ] || die '未找到 Web 目录。请使用 --web-dir 指定已确认的目录（其中需有 index.html）'
case "$web_dir" in /*) ;; *) die 'Web 目录必须为绝对路径' ;; esac
if [ ! -d "$web_dir" ] || [ ! -f "$web_dir/index.html" ]; then die 'Web 目录不存在或缺少 index.html'; fi
web_dir=$(cd "$web_dir" && pwd -P)
case "$web_dir" in /|/etc|/usr|/usr/share|/var|/var/packages|/home|/root|/tmp|/volume[0-9]*)
  # 卷根目录拒绝，卷内已确认的 Web 目录允许。
  case "$web_dir" in /volume[0-9]*/*) ;; *) die '拒绝将系统目录作为 Web 目录' ;; esac ;;
esac
parent=$(dirname "$web_dir")
if [ ! -w "$parent" ] || [ ! -w "$web_dir" ]; then die 'Web 目录及父目录需要写权限，请使用有权限的账户（必要时 sudo）'; fi
if [ -n "$restore" ]; then
  if [ ! -d "$restore" ] || [ ! -f "$restore/index.html" ]; then die '回退目录不存在或缺少 index.html'; fi
  restore=$(cd "$restore" && pwd -P)
  [ "$(dirname "$restore")" = "$parent" ] || die '回退目录必须与当前 Web 目录同级'
  case "$restore" in "$web_dir".cove-backup-*) ;; *) die '仅接受此目录的 Cove 备份' ;; esac
  printf '回退 %s；当前 Web 目录仍会备份。\n' "$web_dir"
else
  command -v sha256sum >/dev/null || die '需要 sha256sum，不能跳过安装包校验'
  resolve_version
  printf '安装 %s 到 %s；只替换 Web 静态文件。\n' "$version" "$web_dir"
fi
confirm
mkdir "$web_dir.cove-lock" 2>/dev/null || die '此目录有安装锁，请确认没有其他安装进程；中断残留时移除 .cove-lock 空目录后重试'
lock="$web_dir.cove-lock"
if [ -z "$restore" ]; then
  asset="transmission-cove-${version#v}-web.tar.gz"
  base="https://github.com/$REPO/releases/download/$version"
  download "$base/$asset" "$work/$asset"
  download "$base/SHA256SUMS" "$work/SHA256SUMS"
  checksum=$(awk -v file="$asset" '$2 == file { print $1 }' "$work/SHA256SUMS")
  [ "${#checksum}" -eq 64 ] || die '校验文件缺少唯一的安装包记录'
  case "$checksum" in *[!0-9a-fA-F]*) die '无效 SHA256' ;; esac
  printf '%s  %s\n' "$checksum" "$asset" > "$work/verify.sha256"
  (cd "$work" && sha256sum -c verify.sha256) || die 'SHA256 不匹配，未修改原目录'
  tar -tzf "$work/$asset" > "$work/entries"
  awk '/^\// || /(^|\/)\.\.(\/|$)/ { exit 1 }' "$work/entries" || die '安装包包含不安全路径'
  tar -tvzf "$work/$asset" > "$work/types"
  awk 'substr($0,1,1) != "-" && substr($0,1,1) != "d" { exit 1 }' "$work/types" || die '安装包不得包含符号链接或特殊文件'
  mkdir "$work/unpacked"
  tar -xzf "$work/$asset" -C "$work/unpacked"
  if [ ! -f "$work/unpacked/index.html" ] || [ ! -d "$work/unpacked/assets" ]; then die '安装包目录结构无效'; fi
fi
stage=$(mktemp -d "$parent/.cove-stage.XXXXXX")
rmdir "$stage"
if [ -n "$restore" ]; then
  cp -a "$restore" "$stage"
else
  # 保留原目录权限和套件附带文件，覆盖前在同一文件系统中完成准备。
  cp -a "$web_dir" "$stage"
  # 防止旧 Web 目录中的同名链接将新资源写出暂存目录。
  find "$stage" -type l -exec rm -f {} \;
  cp -R "$work/unpacked/." "$stage/"
  chmod -R a+rX "$stage"
fi
backup="$web_dir.cove-backup-$(date +%Y%m%d-%H%M%S)-$$"
[ ! -e "$backup" ] || die '备份路径已存在'
swapping=true
mv "$web_dir" "$backup"
mv "$stage" "$web_dir"
stage=
swapping=false
printf '完成。访问原 Transmission Web 地址并强制刷新。\n备份：%s\n' "$backup"
printf '回退命令：sh install.sh --web-dir "%s" --restore "%s"\n' "$web_dir" "$backup"
