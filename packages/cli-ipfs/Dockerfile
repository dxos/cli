FROM node:16.14

LABEL maintainer="admin@dxos.org"
LABEL description="DXOS IPFS server."

ARG NPM_TOKEN
ARG CLI_VER="@dev"

RUN apt-get update && apt-get install -y g++ make python3 libtool autoconf automake

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> /root/.npmrc
RUN yarn global add "@dxos/cli$CLI_VER" "@dxos/cli-ipfs$CLI_VER"
RUN dx profile init --name local --template-url https://git.io/Jfrn0

RUN dx ipfs install
RUN dx ipfs init

EXPOSE 5001, 8888

CMD ["dx", "ipfs", "start", "--connect-interval", "60"]
