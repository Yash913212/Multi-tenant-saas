FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache curl && npm install --production

COPY . .

EXPOSE 5000
CMD ["npm", "start"]
