FROM node:14.17.3 as build
WORKDIR /app

COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json

RUN npm install

EXPOSE 3333
#docker build -t node:erpbe .