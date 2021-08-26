FROM node:12.22.1-alpine

LABEL maintainer="admin@dxos.org"
LABEL description="DXOS app server."

ARG NPM_TOKEN
ARG CLI_VER="@latest"

RUN apk --update add --no-cache python alpine-sdk libtool autoconf automake && rm -rf /var/cache/apk/*

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> /root/.npmrc
# Next layer installs @dxos/cli, @dxos/cli-app and @dxos/cli-dxns globally and forces them to share common dependencies.
# To do so we create a fake project with npm init and install those packages as dependencies. Now in node_modules folder
# we have all necessary dependecies - we move them to system node_modules directory located at
# /usr/local/lib/node_modules. Afterwards we install @dxos/cli, @dxos/cli-app and @dxos/cli-dxns globally and remove all
# their node_modules directory as we can find the same dependencies in /usr/local/lib/node_modules. If packages have
# same dependency but different version of it then npm will place those dependecies in node_module subdirectory, so we
# need to copy contents of node_module subdirectory of @dxos/* dependecies from fake project to system node_modules.
# Sharing dependencies allows to avoid installing multiple instances of the same dependency, therefore saving a lot of
# disk space.
RUN mkdir $SYS_NODE_MODULES/fake && cd $SYS_NODE_MODULES/fake && npm init -y \
    && npm install --unsafe-perm "@dxos/cli$CLI_VER" "@dxos/cli-dxns$CLI_VER" "@dxos/cli-app$CLI_VER" \
    && cd .. && cp -R fake/node_modules/* . && cd ~ \
    && npm install --global --unsafe-perm "@dxos/cli$CLI_VER" "@dxos/cli-dxns$CLI_VER" "@dxos/cli-app$CLI_VER" \
    && rm -rf $SYS_NODE_MODULES/@dxos/cli/node_modules/* \
    && rm -rf $SYS_NODE_MODULES/@dxos/cli-dxns/node_modules/* \
    && rm -rf $SYS_NODE_MODULES/@dxos/cli-app/node_modules/* \
    && (cp -R $SYS_NODE_MODULES/fake/node_modules/@dxos/cli/node_modules/* $SYS_NODE_MODULES/@dxos/cli/node_modules 2>/dev/null || :) \
    && (cp -R $SYS_NODE_MODULES/fake/node_modules/@dxos/cli-dxns/node_modules/* $SYS_NODE_MODULES/@dxos/cli-dxns/node_modules 2>/dev/null || :) \
    && (cp -R $SYS_NODE_MODULES/fake/node_modules/@dxos/cli-app/node_modules/* $SYS_NODE_MODULES/@dxos/cli-app/node_modules 2>/dev/null || :) \
    && rm -rf $SYS_NODE_MODULES/fake
RUN dx profile init --name local --template-url https://git.io/Jfrn0

EXPOSE 5999

CMD ["dx", "app", "serve"]
