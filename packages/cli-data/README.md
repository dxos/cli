# Party CLI

CLI extension for party operations.

## Configuration

Each CLI profile corresponds to a specific CLI user (from a data access perspective).

## Operations

### User initialization

Upon CLI profile creation, new user identity would be created.
In order to reset storage, use `dx storage reset` command.

### Party creation

Use `dx party create` command to create a secured party.

```
$ dx party create
{
  "partyKey": "c88167b0aed0dc618ccf2e850d2def44ea1d3599c05cff2339c563bcc688066b"
}
```

### Party joining

Use `dx party join` command in order to join a party.
Use `--invitation` attribute to pass invitation created by any DXOS app or CLI, e.g.

```
$ dx party join --invitation  eyJzd2FybUtleSI6IjljNWFhZTY2OTFmYWI2YmQ0YTNkODliNGE4NDg5ODNmOGM5YzM0NGMzOWQ5NTJlNWY1NTY0MGI2NjQyNTYzNGIiLCJpbnZpdGF0aW9uIjoiYmViMzA2MTA0NDZjYWJkNTE2OWFiYTNhNDA3Zjg0YzY1YzYzYjY0ZTM0ZDgzNDU3N2IwODAwNDkwOWNhZmVkNSIsInR5cGUiOiIxIiwiaGFzaCI6IjgwY2MyY2QyYzYzYmI4OTliNTk3M2EwNDM5ZWNkMTE4ZTE5NjI5YmUifQ==
```

### Restoring latest party

Use `dx party open` command in order to open a party joined during previous CLI session.

```
$ dx party open
key    value
-----  ----------------------------------------------------------------
party  c339b9433f5733216d3796853d47315157071febf49a7b7a98cff67ea7680559

[dx]>
```

### Inviting another participant to a party

Party creation/joining launches CLI REPL mode, where other CLI commands could be executed.

In order to invite participant from previously created or joined party, `party invite` command could be used within RELP mode:

Invite another DXOS app or CLI user:

```
[dx]> party invite
{
  "partyKey": "59cdb128497d05286bb953e43c331e00d962af4228fc22c492c8c46765a45710",
  "invitation": "eyJzd2FybUtleSI6IjMzMjA1NjZjMzJiZjJhNmZlNDMzYjhmNzI0M2IzMDVkMGU3NTU0NTAxY2I3MDg0MWE2MDI5NmExYTcyYzJjMmEiLCJpbnZpdGF0aW9uIjoiMzc4ZDkyMTA4M2RkMmU4ODMxYzdmZmY5NTRjZWU0NDMzYzFmOGI3NzkzYWI4NDY2ZTU2YzcwNmY1OTg3ZWFlOSIsImhhc2giOiIyODIxNDUwZDc1NGRmYmNhYjU5YmQ1ZjdlY2M2MWMzYjNmYTJkZGU2In0=",
  "passcode": "2525"
}
[dx]>
```

Invitation and passcode should be passed to invitee upon invitation command.
