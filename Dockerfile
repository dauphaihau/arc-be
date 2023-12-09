# Development mode
FROM node:18.19-alpine

# Create folder and copy package.json, .npmrc
WORKDIR /usr/src/node-app
COPY .npmrc package*.json ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@7.4.1 --activate

# Install dependencies
RUN pnpm install

# Copy app files
COPY . .

# Ports
EXPOSE 3000
