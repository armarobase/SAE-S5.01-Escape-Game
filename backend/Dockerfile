# Image du backend Data-Monstre (utilisée par le service "backend" de docker-compose.yml).
# Base Debian "slim" : disponible pour les PC (amd64) et le Raspberry Pi en 64 bits (arm64).
FROM node:22-bookworm-slim

WORKDIR /app

# Dépendances d'abord : cette étape reste en cache tant que package.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Code du backend (les tests et node_modules sont exclus par .dockerignore)
COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production
EXPOSE 3000

# Le serveur ne tourne pas en administrateur dans le conteneur
USER node

CMD ["node", "src/index.js"]
