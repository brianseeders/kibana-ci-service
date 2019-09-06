FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src src
ENTRYPOINT [ "node" ]
CMD [ "./src/index.js" ]