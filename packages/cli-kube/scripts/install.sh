#!/bin/bash

#
# Copyright 2021 DXOS.org
#

export SCRIPT_DIR; SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

SERVICES_FILE_PATH='../dist/src/services.yml'

DEV=${1:-"0"}
[[ "$DEV" == "1" ]] && CLI_VER="alpha" || CLI_VER="latest"

set -euo pipefail

function yarn_not_installed {
  if [ -x "$(command -v yarn)" ]; then
    return 1 # false
  else
    return 0 # true
  fi
}

function install_cli_packages {
  if yarn_not_installed; then
    echo ERROR: Yarn should be installed.
    exit 1
  fi

  yarn --silent yaml2json "$SCRIPT_DIR/$SERVICES_FILE_PATH" | jq -r '.[]|[.package] | @tsv' |
    while IFS=$'\t' read -r package; do
      echo y | dx extension install $package --version $CLI_VER
    done
}

function install_services {
  if yarn_not_installed; then
    echo ERROR: Yarn should be installed.
    exit 1
  fi

  yarn --silent yaml2json "$SCRIPT_DIR/$SERVICES_FILE_PATH" | jq -r '.[]|[.package, .service, .args] | @tsv' |
    while IFS=$'\t' read -r package service args; do
      echo Installing $service service from $package package..
      dx service upgrade \
        `if [ "$DEV" == "1" ]; then echo "--dev"; fi` \
        --from $package \
        --service $service
      echo Done.
    done
}

install_cli_packages
install_services
