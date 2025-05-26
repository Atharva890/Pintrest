
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app
COPY . .
RUN npm ci --only=production

EXPOSE 3000
CMD ["node", "server.js"]