#!/bin/sh

# Developer mode.
# Run `rushx build:watch` then eval this script so that the `x` alias points to the local dist.
# `eval $(./scripts/dev.sh)`

DIR=$(cd "$(dirname "$0")/.."; pwd -P)

echo "alias dx='node ${DIR}/bin/dx.js'"
