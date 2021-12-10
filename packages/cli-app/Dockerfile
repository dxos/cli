FROM node:12.22.1-alpine

LABEL maintainer="admin@dxos.org"
LABEL description="DXOS app server."

ARG NPM_TOKEN
ARG CLI_VER="@latest"

RUN apk --update add --no-cache python alpine-sdk libtool autoconf automake

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> /root/.npmrc
RUN npm install --global --unsafe-perm "@dxos/cli$CLI_VER" "@dxos/cli-dxns$CLI_VER" "@dxos/cli-app$CLI_VER"
RUN dx profile init --name local --template-url https://git.io/Jfrn0

EXPOSE 5999

CMD ["dx", "app", "serve"]
