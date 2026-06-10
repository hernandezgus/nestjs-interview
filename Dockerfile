FROM node:20-bullseye

RUN npm install -g npm@11.16.0 \
    && mkdir -p /workspaces/nestjs-interview \
    && chown -R node:node /workspaces

WORKDIR /workspaces/nestjs-interview

CMD ["npm", "run", "start:dev"]
