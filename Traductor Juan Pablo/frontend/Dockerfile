FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile;     elif [ -f yarn.lock ]; then yarn --frozen-lockfile;     elif [ -f package-lock.json ]; then npm ci; else npm i; fi
COPY index.html ./
COPY vite.config.js ./
COPY .env ./.env
COPY src ./src
EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0"]
