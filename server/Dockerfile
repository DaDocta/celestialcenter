# /server/Dockerfile
FROM node:18

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8080

ENV PORT=8080

CMD ["node", "index.js"]
