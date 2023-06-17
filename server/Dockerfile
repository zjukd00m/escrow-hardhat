FROM node:lts

WORKDIR /app

COPY package.json package-lock.json server.js /app/

RUN npm install

CMD ["node", "server.js"]
