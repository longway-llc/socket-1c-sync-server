FROM node:15-alpine
WORKDIR /app
COPY package.json .
RUN yarn
COPY . .
RUN ["yarn", "build"]
