FROM node:10.14.1-alpine as build
WORKDIR app
COPY . .
RUN npm i --quiet --no-progress --silent && npm run build --quiet --silent

FROM nginx:1.17.6-alpine
COPY --from=build app/dist /usr/share/nginx/html
