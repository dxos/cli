# wire file

Examples:
> TODO(telackey): Proper documentation


Deploy (publish and register):
```
> wire file deploy --path HELLO_WORLD.md --name wrn://dxos/file/helloworld
Preparing to deploy...
Publishing HELLO_WORLD.md...
 ████████████████████████████████████████ 100% | ETA: 0s | 16/16
Registering wrn://dxos/file/helloworld @ QmWkiwSxP7gMFpqJCwJDchXosAWK4UBMQEYjBkRDo76ViF...
Record ID: bafyreigth4yapdfyamgr5fxnxa7qj4z3vgeso6pphdqkwz5rpuisk46qcm
Assigning name wrn://dxos/file/helloworld...
Registered wrn://dxos/file/helloworld @ bafyreigth4yapdfyamgr5fxnxa7qj4z3vgeso6pphdqkwz5rpuisk46qcm.
Done
```

Download:
```
> wire file download --name wrn://dxos/file/helloworld
HELLO_WORLD.md
```
