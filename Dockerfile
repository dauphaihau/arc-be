ARG BUILD_IMAGE=node:18.19-alpine
ARG RUN_IMAGE=gcr.io/distroless/nodejs18-debian11
ARG PNPM_VERSION=7.4.1

FROM $BUILD_IMAGE AS base

RUN npm --global install pnpm@${PNPM_VERSION}

WORKDIR /app

COPY .npmrc package*.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]


FROM base AS build

WORKDIR /app

COPY .npmrc package*.json pnpm-lock.yaml ./
COPY . .
COPY --from=base /app/node_modules ./node_modules

RUN npm --global install pnpm@${PNPM_VERSION}

RUN pnpm build


FROM $BUILD_IMAGE AS production-deps

WORKDIR /app

COPY .npmrc package*.json pnpm-lock.yaml ./

RUN npm --global install pnpm@${PNPM_VERSION}

RUN pnpm install --prod --ignore-scripts


FROM $RUN_IMAGE AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

CMD ["dist/server.js"]
