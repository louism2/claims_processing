FROM     node:17.4-alpine

RUN      mkdir /app
WORKDIR  /app

RUN      apk add --update bash mysql-client
COPY     . /app

RUN      npm install
