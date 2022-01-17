#!/bin/bash

#
# Copyright 2021 DXOS.org
#

export SCRIPT_DIR; SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

SERVICES_FILE_PATH='../dist/services.yml'

DEV=${1:-"0"}
[[ "$DEV" == "1" ]] && CLI_VER="dev" || CLI_VER="latest"

set -euo pipefail

function install_cli_packages {
  npx yaml2json "$SCRIPT_DIR/$SERVICES_FILE_PATH" | jq -r '.[]|[.package] | @tsv' |
    while IFS=$'\t' read -r package; do
      echo y | dx extension install $package --version $CLI_VER
    done
}

function install_services {
  npx yaml2json "$SCRIPT_DIR/$SERVICES_FILE_PATH" | jq -r '.[]|[.package, .service, .args] | @tsv' |
    while IFS=$'\t' read -r package service args; do
      echo Installing $service service from $package package..
      dx service upgrade \
        `if [ "$DEV" == "1" ]; then echo "--dev"; fi` \
        --from $package \
        --service $service
      echo Done.
    done
}

pushd $SCRIPT_DIR

install_cli_packages
install_services

popd
