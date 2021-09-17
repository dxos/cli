# querying

dx dxns resource list --json
dx dxns type list --json
dx dxns record list --json

# we need to create an auction for to own a domain for resource registration

dx dxns auction create marcin 1000000
dx dxns auction list

# the below does not work (account/mnemonic issues) in test-net
DEBUG=dxos.cli* dx dxns auction force-close marcin --mnemonic //Alice --verbose
dx dxns balance increase 1000000000 --mnemonic //Alice
# end of issue

# if force-close does not work we need to wait quite some time and then close the auction
dx dxns auction close marcin

# then claiming the domain to take its ownership
dx dxns auction claim marcin
#output:
#key        value
#---------  ----------------------------------------------------------------
#domainKey  e3078300d96338c3e21bfbdecf5d51d3588a42a03b9402fc3f86921cc7ac6d75

# but you can always list domains here
dx dxns domain list

###################################
# Content creation
###################################

# let's publish some app
# -> cd to the app dir (e.g. in konsole-app):
dx app deploy --dxns --name "konsole.2021-09-17T1034" --domain marcin
dx dxns resource list --json

#output:
#Preparing to deploy...
#Building konsole...
#Build Ok.
#Publishing konsole...
# ████████████████████████████████████████ 100% | ETA: 0s | 58789815/58789815
#Published konsole@1.2.9-alpha.29 with cid Qmaf9T59HSrPDR1tvbULHvJd2jpRFvc7MBRFZ2z6ocqgzx
#Registering konsole@1.2.9-alpha.29...
#Registered konsole@1.2.9-alpha.29.


# let's add a new type
dx dxns type add '.dxos.CoffeeMachine' proto-examples/CoffeeMachine.proto
dx dxns type get QmUwVWtF55SBoBzTcHmkFUWQ5od88S5EPhd5YDz2PqNEcs

dx dxns type add '.dxos.CoffeeMachine' proto-examples/CoffeeMachine.proto --domain e3078300d96338c3e21bfbdecf5d51d3588a42a03b9402fc3f86921cc7ac6d75 --resourceName "CoffeeMachineType"
dx dxns resource list --json

# plumbings:
# let's just add a raw data record
dx dxns record add --domain e3078300d96338c3e21bfbdecf5d51d3588a42a03b9402fc3f86921cc7ac6d75 --name MarcinsCoffeeMachine --typeCid 'QmRWi35dQ3u4m1UYVCUu4MzNmh6ijWAnX8j8taGS1JXj8x' --data '{"name":"Marcins coffee robot","vendor":"Kofe Robotics"}'
#output:
#key        value
#---------  --------------------------------------------------------------------------------------
#id         ~e3078300d96338c3e21bfbdecf5d51d3588a42a03b9402fc3f86921cc7ac6d75:MarcinsCoffeeMachine
#cid        QmShHScfLScmps3QuoMoewNmiftapZPDXijDzCmZswi9zr
#domainKey  e3078300d96338c3e21bfbdecf5d51d3588a42a03b9402fc3f86921cc7ac6d75
dx dxns record get QmShHScfLScmps3QuoMoewNmiftapZPDXijDzCmZswi9zr