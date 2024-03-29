---
title: Profile Authority
description: Create your own workspace
---

## Profile Authority

Our network supports workspaces like npm organizations.
Let's say you work for `fooBar` team and you want to publish multiples apps.

In order to register that authority (workspace) into our network you need to create auction for it:

```
dx dxns auction create fooBar --start-amount 1000000
```

After some time (~ 10 mins), you should be able to close the auction and claim that authority, if no one else has overbidded you.

```
dx dxns auction close fooBar
```

```
dx dxns auction claim fooBar
```

It should prompt out:

```bash
key        value
---------  ----------------------------------------------------------------
domainKey  aaaaaaaaa0258fbf170edb873da49c9bd79fa258fa69abef5e8c55bcc020088e

```

Now you should be ready to deploy your app!