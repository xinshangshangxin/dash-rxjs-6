#!/usr/bin/env bash
set -e

# 先检查 依赖
function _checkDependence() {
	if ! command -v ${1} > /dev/null 2>&1;then
    echo "no ${1} found, please use: \n apk add[brew install][apt install] ${1}"
    exit 1;
	fi
}

_checkDependence jq parallel

# 定义全局变量
scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
projectDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd ../.. && pwd )"

cd ${scriptDir}

# 载入公共函数
source util.sh

# 参数判断
while [[ $# -gt 0 ]]
do
key="$1"
case ${key} in
    docker)
    shift 1
    source build-docker.sh $*
    shift $#
    ;;
    *)
    echo ${key}
    shift
    ;;
esac
done
