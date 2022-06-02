FROM node:14.17.3 as build
WORKDIR /app

COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json

COPY . /app

RUN npm install

EXPOSE 3333

CMD ["node","index.js"]
#docker build -t node:betravelio .