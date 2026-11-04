# Painel admin

App independente em Vite + React + TypeScript para manter produtos e categorias.

## Iniciar

```bash
npm install
cp .env.example .env.local
npm run dev
```

O Vite inicia em `http://localhost:5174`. `VITE_API_URL` recebe somente a URL
pública da API, por exemplo `http://localhost:3001/api`; não configure a chave
admin em variáveis do Vite.

Adicione `http://localhost:5174` à lista `CORS_ORIGIN` do servidor. Em produção,
configure a origem real do painel e sirva painel e API por HTTPS no mesmo site,
pois a sessão usa cookie `Secure` e `SameSite=Strict`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
```

O app mantém a chave somente durante o envio do login. A API a troca por uma
sessão em cookie HttpOnly; o frontend não grava a chave em armazenamento local.
