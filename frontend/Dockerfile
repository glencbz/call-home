FROM call-home-shared

WORKDIR /app/frontend

COPY package.json .
COPY package-lock.json .

RUN npm run init
RUN npm install

COPY tsconfig.json .
COPY src/ src/
COPY public/ public/

RUN npm start
