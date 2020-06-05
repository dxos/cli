# XBOX CLI

CLI extension for various XBOX related operations.

## Registering an XBOX

`wire xbox register` command could be used to register an XBOX in WNS. An XBOX ID should be provided with `--id` parameter; in case of initial registeration `--version` paramete is also required, later on for subsequent WNS updates it will be incremented automatically if `--version` not supplied.

```
$ wire xbox register  --id "wrn:xbox:example.com/mybox"  --data.web.url "http://xbox.test.com" --version "1.0.0"
```

## Query

To get all registered XBOXes:

```
$ wire xbox query
```

## List URLs of all public XBOXes:

```
$ wire xbox list
```