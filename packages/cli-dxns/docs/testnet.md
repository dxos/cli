# Testnet creation process.

Based on https://substrate.dev/docs/en/tutorials/start-a-private-network tutorial.

Keys for nodes: `keybase://team/dxos/credentials/dxns-testnet-keys.txt`

CLI command to deploy KUBE with 1st botstrap node:

```
dx machine create \
  --cliver '@alpha' \
  --register \
  --services '[{"package":"@dxos/cli-dxns","service":"dxns","args":"--validator --name dxns1"}]'
```

Setup keys:
