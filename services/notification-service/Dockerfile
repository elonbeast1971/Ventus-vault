FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

ENV PORT=3006
EXPOSE 3006

CMD ["node", "index.js"]
