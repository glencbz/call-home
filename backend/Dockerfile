FROM call-home-shared

RUN apt update && apt install -y sqlite3

WORKDIR /app/backend

RUN npm install -g node-gyp node-pre-gyp
RUN npm install --build-from-source --sqlite=/usr/local sqlite3

COPY package.json .
COPY package-lock.json .
RUN npm run init
RUN npm install

COPY tsconfig.json .
COPY src/ src/

CMD npm run migration:seed && npm run start:dev
