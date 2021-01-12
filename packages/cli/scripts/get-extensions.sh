#!/bin/sh

set -euo pipefail

EXTENSION_FILE="extension.yml"
EXTENSIONS="["

for extensiondir in `find ../ -name 'cli-*' -type d | grep -v node_modules | sort`; do
  pushd $extensiondir

  if [ -f "$EXTENSION_FILE" ]; then
    if [ "$EXTENSIONS" != "[" ]; then
      EXTENSIONS+=","
    fi
    EXTENSIONS+=`yarn --silent js-yaml "$EXTENSION_FILE"`
  fi

  popd
done

EXTENSIONS+="]"

echo $EXTENSIONS | yarn jqn
