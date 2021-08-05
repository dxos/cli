FROM node:12.22.1-alpine

LABEL maintainer="admin@dxos.org"
LABEL description="DXOS app server."

ARG NPM_TOKEN

RUN apk --update add --no-cache python alpine-sdk libtool autoconf automake

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> /root/.npmrc
RUN npm install --global --unsafe-perm @dxos/cli@alpha @dxos/cli-dxns@alpha @dxos/cli-app@alpha
RUN dx profile init --name local --template-url https://git.io/Jfrn0

EXPOSE 5999

CMD ["dx", "app", "serve"]
