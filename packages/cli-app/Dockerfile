FROM node:12.22.1-alpine

LABEL description="DXOS app server."

ARG NPM_TOKEN
ARG CLI_VER="@latest"

RUN apk --update add --no-cache python alpine-sdk libtool autoconf automake && rm -rf /var/cache/apk/*

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> /root/.npmrc
RUN mkdir /usr/local/lib/node_modules/fake && cd /usr/local/lib/node_modules/fake && npm init -y \
    && npm install --unsafe-perm "@dxos/cli$CLI_VER" "@dxos/cli-dxns$CLI_VER" "@dxos/cli-app$CLI_VER" \
    && cd .. && cp -R fake/node_modules/* . && rm -rf fake && cd ~ \
    && npm install --global --unsafe-perm "@dxos/cli$CLI_VER" "@dxos/cli-dxns$CLI_VER" "@dxos/cli-app$CLI_VER" \
    && rm -rf /usr/local/lib/node_modules/@dxos/*/node_modules
RUN dx profile init --name local --template-url https://git.io/Jfrn0

EXPOSE 5999

CMD ["dx", "app", "serve"]
