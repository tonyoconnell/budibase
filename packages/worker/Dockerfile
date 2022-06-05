FROM node:14-alpine AS WORKER_BUILD_IMAGE

LABEL com.centurylinklabs.watchtower.lifecycle.pre-check="scripts/watchtower-hooks/pre-check.sh"
LABEL com.centurylinklabs.watchtower.lifecycle.pre-update="scripts/watchtower-hooks/pre-update.sh"
LABEL com.centurylinklabs.watchtower.lifecycle.post-update="scripts/watchtower-hooks/post-update.sh"
LABEL com.centurylinklabs.watchtower.lifecycle.post-check="scripts/watchtower-hooks/post-check.sh"

WORKDIR /app

# copy files and install dependencies
COPY . ./

# handle node-gyp
RUN apk add --no-cache --virtual .gyp python3 make g++ \
    && yarn && apk del .gyp
RUN yarn global add pm2
RUN yarn build
RUN npm prune --production

# Final build stage image
FROM node:14-alpine

WORKDIR /app

# copy from build image
COPY --from=WORKER_BUILD_IMAGE /app/dist ./dist
COPY --from=WORKER_BUILD_IMAGE /app/node_modules ./node_modules
COPY package.json ./
COPY docker_run.sh ./
COPY pm2.config.js ./

EXPOSE 4001

# have to add node environment production after install
# due to this causing yarn to stop installing dev dependencies
# which are actually needed to get this environment up and running
ENV NODE_ENV=production
ENV CLUSTER_MODE=${CLUSTER_MODE}
CMD ["./docker_run.sh"]