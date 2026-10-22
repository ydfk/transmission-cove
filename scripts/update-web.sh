#!/bin/sh
# 供独立 Node 服务调用，仅更新其 Web 静态目录；安装器负责校验与备份。
set -eu
[ "$#" -eq 1 ] || { printf '需要一个版本 Tag\n' >&2; exit 1; }
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec sh "$script_dir/install.sh" --yes --version "$1" --web-dir "${STATIC_ROOT:-$script_dir/../dist}"
