FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY --chown=node:node . .
USER node
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "app.mjs"]
