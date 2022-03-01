---
title: Profile Keys Setup
description: Identify yourself
---

## User keys

Some services will request you extra credentials, for example in order to deploy an app you need to have a funded DXNS account.

You could use CLI in order to generate new account:

```
dx dxns account generate
key       value
--------  ----------------------------------------------------------------------------
mnemonic  eyebrow dust cry stove someone remind insane talk health slight swarm yellow
address   5EpqhyY9AfHgmrqwFs7tFh3V89ktNamgTP3TWM5zgeQM8y7a
```

To add funds to a newly created DXNS account using faucet:

```
dx dxns balance increase --faucet https://dxns2.kube.dxos.network/kube/faucet --address 5EpqhyY9AfHgmrqwFs7tFh3V89ktNamgTP3TWM5zgeQM8y7a
```

To check balance:

```
dx dxns balance get 5EpqhyY9AfHgmrqwFs7tFh3V89ktNamgTP3TWM5zgeQM8y7a
key      value
-------  -------------
balance  1000000000000
```

In order to use newly created account update your profile yml - under the service `dxns` update `accountUri` with a newly created mnemonic, e.g.:


```
    accountUri: 'eyebrow dust cry stove someone remind insane talk health slight swarm yellow'
```
