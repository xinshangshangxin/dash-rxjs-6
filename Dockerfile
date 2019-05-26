FROM node:10-alpine as tool-build
LABEL label=tool-build
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm i

COPY . .
RUN npm run build \
    && cp -r src/assets/ dist/assets/



FROM node:10-alpine

WORKDIR /app

COPY --from=tool-build /app/dist/package.json package.json
COPY --from=tool-build /app/package-lock.json package-lock.json
RUN npm i --production

COPY --from=tool-build /app/dist/ /app/
