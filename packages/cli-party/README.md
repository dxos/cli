# Data CLI

CLI extension for party operations.

# Operations

## Party creation

Use `dx party create` command to create a secured party.

```
dx party create
{
  "partyKey": "c88167b0aed0dc618ccf2e850d2def44ea1d3599c05cff2339c563bcc688066b"
}
```

## Party joining

Use `dx party join <PARTY KEY>` command in order to join a party.
If an invitation link was created in any DXOS app, use `--url` attribute to pass invitation url, e.g.

```
dx party join e6f6c2ba96d972fa56ab3c74cd6453b1fc8384a5bc63ccac701767880d120d92 --url https://xbox3.bozemanpass.com/app/d.boreh.am/dbeditor@0.0.16/#/auth?swarmKey=ee8b175d762dd6a054e066e900b9f39a70587f04fbb4b874d84837353c38c3ba&invitation=4b7d885a1b5927971656b5606c49439c4232e4fed0da5a91cf10678cb55cf88a&hash=78ca686ea23d0ddaaf69eddbc3a413490cecc3d3
```

If an invitation was created from another CLI, use `--invitation` attribute to supply the invitation, e.g.

```
dx party join e6f6c2ba96d972fa56ab3c74cd6453b1fc8384a5bc63ccac701767880d120d92 --inviation eyJzd2FybUtleSI6IjA4MDhmYWUyYTA3MTViYzU1OGZjZDBkOWFmODRhODcwYTJkYmI0ZDVlZmY3ZDYxZjI2ODc1MWFkYmYyZDE2NGQiLCJpbnZpdGF0aW9uIjoiZDVlOGI1NmU2MTA2ZmM5NzhmNmUzYmEwZDJjYzlmMmVmODFhZDEzN2NmYmQ2NDFhYTkzNDc5M2Y1NTk5YTMzZiIsImhhc2giOiI3YjRjYzAxMzViM2FjYWEwZDMxMWI3YjcxYmEyZjQwMzQwYjcwODRhIn0=
```

## Inviting another participant to a party

Party creation/joining launches CLI REPL mode, where other CLI commands could be executed.

In order to invite participant from previously created or joined party, `party invite` command could be used within RELP mode:

Invite another CLI instance:

```
[dx]> party invite
{
  "partyKey": "59cdb128497d05286bb953e43c331e00d962af4228fc22c492c8c46765a45710",
  "invitation": "eyJzd2FybUtleSI6IjMzMjA1NjZjMzJiZjJhNmZlNDMzYjhmNzI0M2IzMDVkMGU3NTU0NTAxY2I3MDg0MWE2MDI5NmExYTcyYzJjMmEiLCJpbnZpdGF0aW9uIjoiMzc4ZDkyMTA4M2RkMmU4ODMxYzdmZmY5NTRjZWU0NDMzYzFmOGI3NzkzYWI4NDY2ZTU2YzcwNmY1OTg3ZWFlOSIsImhhc2giOiIyODIxNDUwZDc1NGRmYmNhYjU5YmQ1ZjdlY2M2MWMzYjNmYTJkZGU2In0=",
  "passcode": "2525"
}
[dx]>
```

Invite any DXOS app user using `--app-url` attribute:

```
[dx]> party invite --app-url https://demo.boxes.dxos.network/app/ashwinp.com/editor@0.0.12
{
  "partyKey": "d357838960e75139ad1263426005968f94fed3b42dcc92d77b71b652e1810892",
  "invitationUrl": "https:/demo.boxes.dxos.network/app/ashwinp.com/editor@0.0.12/#/auth?hash=ada34e11e2985f0f35bb429e7da7894bdbce5336&invitation=34ea2985b390dadccd1c3efe0f32a441b9309881cf6714f2166df2279457bba3&swarmKey=25a97c85aaf7732b0826517850ecc99e5d5de3d7a9457607ddb8f5e8458f8215",
  "passcode": "1451"
}
[dx]>
```

Invitation URL should be passed to invitee upon invitation command.
