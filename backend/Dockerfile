FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g npm@11
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN npm install -g npm@11
RUN addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads && chown app:app uploads
USER app
EXPOSE 3001
CMD ["node", "dist/main"]
