FROM node:15-alpine
WORKDIR /app
COPY package.json .
RUN yarn
COPY . .
CMD ["yarn", "dev"]
