# --- deps stage: install dependencies in isolation for better layer caching ---
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# --- runtime stage: just the installed deps + source, nothing else ---
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

EXPOSE 8080

USER node

CMD ["npm", "start"]
