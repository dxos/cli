# E2E

## Prerequisites

1. Install [IPFS](https://github.com/ipfs/go-ipfs).
2. Run `ipfs init`.
3. Run `ipfs daemon --writable` in a separate window.

## Running tests

Run the E2E tests:

```bash
yarn e2e
```

For increased verbosity:

```bash
E2E_DEBUG=1 yarn test:e2e
```

The tests use a built version of the CLI, so run `yarn && yarn build` in the repo root first.
