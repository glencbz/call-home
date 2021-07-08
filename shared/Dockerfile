FROM node:15

WORKDIR /app/shared

COPY package.json .
COPY package-lock.json .

RUN npm run init
RUN npm install

COPY types/ types/
