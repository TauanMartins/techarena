FROM node:26.12.1-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4200

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4200"]
