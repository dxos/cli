# ECHO CLI

CLI extension for ECHO operations.

## Prerequisites 

### CLI installation

Make sure you are using latest alpha CLI.

Uninstall old version:

```
$ dx uninstall
```

Install latest:

```
$ yarn global add @dxos/cli@alpha
```

Activate devnet-moon profile:

```
$ dx profile init --name devnet-moon --template-url https://git.io/JUkhm
$ export DX_PROFILE="devnet-moon"
```

Install required extensions:

```
$ dx extension install @dxos/cli-party --version alpha
$ dx extension install @dxos/cli-echo --version alpha
$ dx extension install @dxos/cli-registry --version alpha
```

Verify installed extensions:

```
dx extension list
extension       command          version         description
--------------  ---------------  --------------  -----------------
@dxos/cli-party party            2.0.31-alpha.0  Party management.
@dxos/cli-echo  echo             2.0.31-alpha.0  Echo operations.
```

### Party

All echo commands operate inside party;

To create a party:

```
$ dx party create
{
  "partyKey": "4dcd6b391df836cbb038c05ee869a7fa86113188133969078eb0bb0965624a97"
}
[dx]>
```

To create invitation, use `party invite` command inside interactive mode (for redeeming in another CLI or App):

```
$ dx party create
{
  "partyKey": "6aab50776b87f0525ba03f522b4a591a9145458110cfb29f8aba40c4981fe9d5"
}
[dx]> party invite
{
  "partyKey": "6aab50776b87f0525ba03f522b4a591a9145458110cfb29f8aba40c4981fe9d5",
  "invitation": "eyJzd2FybUtleSI6IjJkZGFlNzhjNWM5ZmM4OTI2YzUzZDZlNTJjODBiZWU1OGMyNWFiYzI1OWFjMmMyOGE5OWZiNmJhYWIzMTRhOTMiLCJpbnZpdGF0aW9uIjoiN2NlYzlmMjE3OTE1ZGM0ODJmOTk4N2QwZjA0MjhjYmUxMDdhMjI4OTJmNjFjNjA0NzQzZTYwNTM1ODI5ZTEyZiIsInR5cGUiOiIxIiwiaGFzaCI6ImVjYzM4ZmFkODg3ODRjZmYzODhmZWEyZGRkZTdkZmRjNzNlNWMwYTYifQ==",
  "passcode": "8946"
}
[dx]>
```

To join a party (from other CLI instance):

```
$ dx party join --invitation eyJzd2FybUtleSI6IjJkZGFlNzhjNWM5ZmM4OTI2YzUzZDZlNTJjODBiZWU1OGMyNWFiYzI1OWFjMmMyOGE5OWZiNmJhYWIzMTRhOTMiLCJpbnZpdGF0aW9uIjoiN2NlYzlmMjE3OTE1ZGM0ODJmOTk4N2QwZjA0MjhjYmUxMDdhMjI4OTJmNjFjNjA0NzQzZTYwNTM1ODI5ZTEyZiIsInR5cGUiOiIxIiwiaGFzaCI6ImVjYzM4ZmFkODg3ODRjZmYzODhmZWEyZGRkZTdkZmRjNzNlNWMwYTYifQ==
```

To list members, run `party members list` inside interactive mode:

```
[dx]> party members list
publicKey                    displayName
---------------------------  ----------------
lactose-pasta-hydrogen-mars  cli:egorgripasov
south-blue-jupiter-oxygen    egor
```

## Commands

All the commands should be run inside interactive mode.

To create item:

```
[dx]> echo create --props.foo=bar --props.foo2=bar2
key     value
------  ----------------------------------------------------------------
id      b3d7f2ef8290f27f6c60fbfac5a2863190269f3ac3e105261216468a867760a1
type    dxn://dxos.org/item/general
parent  null
props   {"foo":"bar","foo2":"bar2"}
```

To list items:

```
[dx]> echo list
id                                                                type                         modelType                             modelName    deleted
----------------------------------------------------------------  ---------------------------  ------------------------------------  -----------  -------
2f1ff4677c3f93bded320b2625a1a0a0445fcd3c9088c6b71c71772165c759d2  dxn://dxos.org/item/party    dxn://protocol.dxos.org/model/object  ObjectModel  false
b3d7f2ef8290f27f6c60fbfac5a2863190269f3ac3e105261216468a867760a1  dxn://dxos.org/item/general  dxn://protocol.dxos.org/model/object  ObjectModel  false
```

To update item:

```
[dx]> echo update --itemId b3d7f2ef8290f27f6c60fbfac5a2863190269f3ac3e105261216468a867760a1 --props.foo2=notBar2
key     value
------  ----------------------------------------------------------------
id      b3d7f2ef8290f27f6c60fbfac5a2863190269f3ac3e105261216468a867760a1
type    dxn://dxos.org/item/general
parent  null
props   {"foo":"bar","foo2":"notBar2"}
```

Soft delete / restore:

```
[dx]> echo delete b3d7f2ef8290f27f6c60fbfac5a2863190269f3ac3e105261216468a867760a1
key     value
------  ----------------------------------------------------------------
id      b3d7f2ef8290f27f6c60fbfac5a2863190269f3ac3e105261216468a867760a1
type    dxn://dxos.org/item/general
parent  null
props   {"foo":"bar","foo2":"notBar2","deleted":true}

[dx]> echo restore b3d7f2ef8290f27f6c60fbfac5a2863190269f3ac3e105261216468a867760a1
key     value
------  ----------------------------------------------------------------
id      b3d7f2ef8290f27f6c60fbfac5a2863190269f3ac3e105261216468a867760a1
type    dxn://dxos.org/item/general
parent  null
props   {"foo":"bar","foo2":"notBar2","deleted":false}
```
