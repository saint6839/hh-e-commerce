FROM --platform=$BUILDPLATFORM node:18 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM --platform=$TARGETPLATFORM node:18-slim

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY .env.production ./.env

EXPOSE 3000

CMD ["node", "dist/src/main.js"]