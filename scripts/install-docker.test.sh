#!/bin/sh
# 在专用测试容器中运行，需 Docker CLI、测试镜像和宿主机 socket；不拉取远程发布镜像。
set -eu
installer=$(cd "$(dirname "$0")" && pwd)/install.sh
fixture=$(mktemp -d)
name="cove-installer-smoke-$$"
image=ghcr.io/ydfk/transmission-cove:v0.0.0-installer-test
real_docker=$(command -v docker)
export REAL_DOCKER="$real_docker" FIXTURE_IMAGE="$image"
cleanup() {
  for container in $("$real_docker" ps -a --format '{{.Names}}' | grep "^$name" || true); do "$real_docker" rm -f "$container" >/dev/null; done
  rm -rf "$fixture"
}
trap cleanup EXIT HUP INT TERM
"$real_docker" image inspect "$image" >/dev/null
mkdir "$fixture/bin"
cat > "$fixture/bin/docker" <<'EOF'
#!/bin/sh
if [ "$1" = pull ]; then "$REAL_DOCKER" image inspect "$FIXTURE_IMAGE" >/dev/null; exit $?; fi
if [ "$1" = exec ] && [ "${FAIL_HEALTH:-false}" = true ]; then exit 1; fi
exec "$REAL_DOCKER" "$@"
EOF
chmod +x "$fixture/bin/docker"
export PATH="$fixture/bin:$PATH"
run() { sh "$installer" --mode docker --version v0.0.0-installer-test --name "$name" --port 18883 --yes; }
run
[ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ]
run
docker ps -a --format '{{.Names}}' | grep -q "^$name-backup-"
if FAIL_HEALTH=true run; then echo '应报告健康检查失败'; exit 1; fi
[ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ]
docker exec "$name" node -e 'fetch("http://127.0.0.1:18883/").then(r=>{if(!r.ok)process.exit(1)})'
docker rm -f "$name" >/dev/null
docker run -d --name "$name" --entrypoint sh "$image" -c 'sleep 120' >/dev/null
if run; then echo '应拒绝覆盖非安装器创建的同名容器'; exit 1; fi
[ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ]
printf 'Docker 安装验证通过：真实容器安装、更新备份、失败回退和非托管容器保护。\n'
