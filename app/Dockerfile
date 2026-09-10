FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and clean npm cache
RUN apk add --no-cache openssl && npm cache clean --force

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
