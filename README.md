# callhome.sg

This is very much in the MVP stage.

## What does it do?

- Call a user-specified number
- Save user preferences to the DB

## How to run

### Setup

- [TypeScript](https://www.npmjs.com/package/typescript)
- node 12 (preferably installed with versioning tool such as [Node Version Manager](https://github.com/nvm-sh/nvm))
- [Docker and docker-compose](https://docs.docker.com/get-docker/), if you want to use the docker method
- A `backend/.env` file, taking reference from `backend/.env.sample`

Backend runs on port `4000` while Frontend runs on port `3000` and can be run using the instructions below.

### Server

#### npm script

```bash
cd backend
npm run start-local
```

#### Docker

This app is built and run with docker.

```sh
# build the image
docker build . -t call-home

# run the image
docker run -it call-home
```

#### docker-compose

Or more conveniently with docker-compose from repository root.

```bash
# To include new docker image build
docker-compose up --build

# To use existing docker image
docker-compose up
```

To use postgres as your development database:

```bash
# backend/.env
...
...
DATABASE_URL=postgresql://postgres:password@db:5432/callhome
...
...
```

If you are already using common ports, you can select the port for access via localhost in `docker-compose.yml`.

There is no need to change the mentioned `DATABASE_URL` as that reference is within the docker network, not on your localhost.

Just change the `ports` configuration.

```bash
# docker-compose.yml
...
...
    ports:
      - DESIRED_PORT:DONT_CHANGE_THIS
...
...
```


### Frontend

```bash
cd frontend
npm start
```
