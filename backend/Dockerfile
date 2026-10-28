FROM node:26.12.1-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --global npm@11.20.0 && npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
