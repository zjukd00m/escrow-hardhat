FROM node:lts AS installer

WORKDIR /app

COPY /app/package.json /app/package-lock.json /app/

RUN npm install


FROM node:lts AS builder

WORKDIR /app

COPY --from=installer /app/node_modules /app/node_modules
COPY package.json /app/package.json
COPY /app/public /app/public
COPY /app/src /app/src
COPY tailwind.config.js /app/tailwind.config.js

RUN npm run build


