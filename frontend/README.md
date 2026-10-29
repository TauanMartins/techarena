# Frontend TechArena

Aplicacao web inicial em React e TypeScript, criada com Vite seguindo o [guia oficial do React para iniciar uma aplicacao do zero](https://react.dev/learn/build-a-react-app-from-scratch).

## Executar com Docker Compose

Na raiz do repositorio:

```bash
docker compose up --build
```

A aplicacao fica disponivel em <http://localhost:4200>. O Compose tambem inicia o backend e o PostgreSQL local.

## Executar localmente

```bash
npm ci
npm run dev
```

Para validar o projeto:

```bash
npm run build
npm run lint
```
