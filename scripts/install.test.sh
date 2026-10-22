#!/bin/sh
# 使用隔离目录和固定下载响应，不访问 NAS、远程下载或真实 daemon。
set -eu
installer=$(cd "$(dirname "$0")" && pwd)/install.sh
updater=$(cd "$(dirname "$0")" && pwd)/update-web.sh
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT HUP INT TERM
export FIXTURE_DIR="$fixture"
mkdir "$fixture/bin" "$fixture/source" "$fixture/source/assets" "$fixture/web"
mkdir "$fixture/outside"
printf untouched > "$fixture/outside/app.js"
ln -s "$fixture/outside" "$fixture/web/assets"
printf old > "$fixture/web/index.html"
printf keep > "$fixture/web/package-file.txt"
printf untouched > "$fixture/settings.json"
printf new > "$fixture/source/index.html"
printf asset > "$fixture/source/assets/app.js"
printf '{"version":"0.1.0","updateProtocol":1}' > "$fixture/source/cove-version.json"
asset=transmission-cove-0.1.0-web.tar.gz
tar -czf "$fixture/$asset" -C "$fixture/source" .
(cd "$fixture" && sha256sum "$asset" > SHA256SUMS)
cat > "$fixture/bin/curl" <<'EOF'
#!/bin/sh
set -eu
url= output=
while [ "$#" -gt 0 ]; do
  case "$1" in
    https://*) url=$1; shift ;;
    -o) output=$2; shift 2 ;;
    *) shift ;;
  esac
done
[ "${FAIL_DOWNLOAD:-false}" = false ] || exit 22
case "$url" in
  */releases/latest) printf '{"tag_name":"v0.1.0"}' > "$output" ;;
  *) cp "$FIXTURE_DIR/${url##*/}" "$output" ;;
esac
EOF
chmod +x "$fixture/bin/curl"
export PATH="$fixture/bin:$PATH"
run() { sh "$installer" --web-dir "$fixture/web" --yes "$@" > "$fixture/output" 2>&1 || { cat "$fixture/output" >&2; return 1; }; }
run
[ "$(cat "$fixture/web/index.html")" = new ]
[ "$(cat "$fixture/web/package-file.txt")" = keep ]
[ "$(cat "$fixture/settings.json")" = untouched ]
[ "$(cat "$fixture/outside/app.js")" = untouched ]
[ ! -L "$fixture/web/assets" ]
original=$(find "$fixture" -maxdepth 1 -type d -name 'web.cove-backup-*' | head -n 1)
[ "$(cat "$original/index.html")" = old ]
run --restore "$original"
[ "$(cat "$fixture/web/index.html")" = old ]
run --version v0.1.0
[ "$(cat "$fixture/web/index.html")" = new ]
STATIC_ROOT="$fixture/web" sh "$updater" v0.1.0 > "$fixture/output" 2>&1
[ "$(cat "$fixture/web/cove-version.json")" = '{"version":"0.1.0","updateProtocol":1}' ]
if STATIC_ROOT="$fixture/web" sh "$updater" > "$fixture/output" 2>&1; then echo '应拒绝缺失更新版本'; exit 1; fi
printf '%064d  %s\n' 0 "$asset" > "$fixture/SHA256SUMS"
if run --version v0.1.0; then echo '应拒绝损坏的校验和'; exit 1; fi
[ "$(cat "$fixture/web/index.html")" = new ]
[ ! -d "$fixture/web.cove-lock" ]
if FAIL_DOWNLOAD=true run; then echo '应拒绝失败的下载'; exit 1; fi
if sh "$installer" --web-dir / --yes > "$fixture/output" 2>&1; then exit 1; fi
if run --restore "$fixture/source"; then echo '应拒绝非对应备份'; exit 1; fi
ln -s /etc/passwd "$fixture/source/assets/unsafe"
tar -czf "$fixture/$asset" -C "$fixture/source" .
(cd "$fixture" && sha256sum "$asset" > SHA256SUMS)
if run --version v0.1.0; then echo '应拒绝安装包中的符号链接'; exit 1; fi
rm "$fixture/source/assets/unsafe"
tar -czf "$fixture/$asset" -C "$fixture/source" .
(cd "$fixture" && sha256sum "$asset" > SHA256SUMS)
printf before-failure > "$fixture/web/index.html"
cat > "$fixture/bin/mv" <<'EOF'
#!/bin/sh
case "$1" in */.cove-stage.*) exit 1 ;; esac
exec /bin/mv "$@"
EOF
chmod +x "$fixture/bin/mv"
if run --version v0.1.0; then echo '应报告目录切换失败'; exit 1; fi
[ "$(cat "$fixture/web/index.html")" = before-failure ]
[ ! -d "$fixture/web.cove-lock" ]
printf '安装脚本验证通过：安装、更新、备份、回退、校验失败、下载失败、目录保护、链接拒绝和中断恢复。\n'
