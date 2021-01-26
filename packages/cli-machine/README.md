# Machine CLI

`dx machine` allows automated creation and management of kubes in cloud hosting.

## Commands

`dx machine list`

```
$ dx machine list
{
  "machines": [
    {
      "name": "kubec18e28d7",
      "created_at": "2020-05-26T21:25:20Z"
    },
    {
      "name": "kubef1145cc7",
      "created_at": "2020-05-26T21:25:23Z"
    },
    {
      "name": "kube087f310c",
      "created_at": "2020-05-28T14:51:55Z"
    }
  ]
}
```

`dx machine create --name <optionalkubename> --memory <optionalmemorysize>`

```
$ dx machine create
{
  "machine": {
    "name": "kube087f310c"
  }
}
```

Memory sizes supported: 1,2,4,8,16,32G. Note that sizes smaller than 4G may not allow base Kube services to operate.

`dx machine publish --name <kubename>`

``` 
$ /home/david/projects/dxos/incubator/node_modules/.bin/dx machine publish --name kube087f310c
{
  "machine_data": {
    "name": "kube087f310c",
    "dns_name": "kube087f310c.boxes.dxos.network",
    "dxn": "kube.dxos.network/box087f310c"
  }
}
```

## Configuration

Obtain an [API access token for Digital Ocean](https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/) 
and a [GitHub Personal Access Token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line):

In dx profile:
```
services:
  machine:
    doAccessToken: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    githubAccessToken: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    dnsDomain: 'kube.dxos.network'
```
