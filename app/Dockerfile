FROM node:20

WORKDIR /usr/src/app

RUN npm install -g @nestjs/cli

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "start:dev"]