FROM node:16.14

LABEL maintainer="admin@dxos.org"
LABEL description="DXOS app server."

ARG NPM_TOKEN
ARG CLI_VER="@latest"

RUN apt-get update && apt-get install -y g++ make python3 libtool autoconf automake

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> /root/.npmrc
RUN yarn global add "@dxos/cli$CLI_VER" "@dxos/cli-dxns$CLI_VER" "@dxos/cli-app$CLI_VER"
RUN dx profile init --name local --template-url https://bit.ly/3M37HBT

EXPOSE 5999

CMD ["dx", "app", "serve"]
