#/bin/sh

#
# Copyright 2021 DXOS.org
#

set -e

[ -d "~/.ipfs" ] && exit 0

wget https://dist.ipfs.io/go-ipfs/v0.11.0/go-ipfs_v0.11.0_linux-amd64.tar.gz
tar -xvzf go-ipfs_v0.11.0_linux-amd64.tar.gz

pushd go-ipfs
sudo bash install.sh
popd

ipfs init
