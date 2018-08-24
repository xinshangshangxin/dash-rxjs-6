FROM node:8-alpine as tool-build

WORKDIR /app

COPY ./package.json /app/package.json
RUN yarn

COPY . /app
RUN npm run build \
    && cp -r src/assets/ dist/assets/



FROM node:8-alpine

WORKDIR /app

COPY --from=tool-build /app/dist/package.json package.json
RUN yarn --production

COPY --from=tool-build /app/dist/ /app/
