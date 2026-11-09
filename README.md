# LookShow

Loja de roupas femininas em **Araripe-CE**, com venda presencial e loja virtual.
O catálogo é mantido por um painel administrativo próprio e os pedidos são
fechados pelo **WhatsApp**: o site monta o carrinho, valida preço e estoque no
servidor e gera a mensagem do pedido. Pagamento e entrega são combinados no
atendimento.

## Entrega

- Apenas na localidade de **Araripe-CE**.
- **Retirada na loja** ou **entrega na casa do cliente**.
- O pedido não coleta endereço nem calcula frete; isso é combinado no WhatsApp.
- Pagamento combinado no atendimento: **Pix ou cartão**.

## Estrutura do repositório

```
.
├── server/             API REST (NestJS + Fastify + Prisma + PostgreSQL)
├── client/             loja virtual (React + Vite)
├── admin/              painel administrativo (React + Vite)
├── docker-compose.yml  PostgreSQL 17 e Redis 7 para desenvolvimento
└── PRODUCT.md          notas de produto (parcialmente desatualizado)
```

## Stack

| Camada | Tecnologias |
| --- | --- |
| API | NestJS 11, Fastify 5, Prisma 7, PostgreSQL, Redis, Supabase Storage |
| API — suporte | Pino (logs), Zod (ambiente), class-validator, Swagger, Throttler |
| Loja | React 19, Vite 8, TypeScript, React Router 7, TanStack Query 5, Zustand 5, Axios, Tailwind CSS 4 |
| Painel | React 19, Vite 8, TypeScript, React Router 7, TanStack Query 5, Axios, Tailwind CSS 4 |
| Testes | Jest + Supertest (API), Vitest + Testing Library (frontends) |

## Como rodar localmente

### Pré-requisitos

- **Node.js 22 LTS ou 24** (recomendado).
  O projeto foi executado em Node 20.20.2, mas o npm 12 instalado no ambiente
  avisa que essa versão não é suportada; veja [Limitações](#limitações-conhecidas).
- npm
- Docker e Docker Compose (para PostgreSQL e Redis)

### 1. Banco e cache

O `docker-compose.yml` exige a variável `POSTGRES_PASSWORD` no ambiente. Defina
uma senha local forte e exclusiva antes de subir os serviços:

```bash
export POSTGRES_PASSWORD='defina-uma-senha-local-forte'
docker compose up -d
```

Isso sobe PostgreSQL em `127.0.0.1:5432` e Redis em `127.0.0.1:6379`, ambos
acessíveis apenas pelo próprio computador. Se a senha escolhida não for a do
`.env.example`, ajuste `DATABASE_URL` e `DIRECT_URL` em `server/.env` para usar
o usuário `loja`, o banco `loja_roupas` e a mesma senha.

### 2. API

```bash
cd server
cp .env.example .env
```

Edite `server/.env` manualmente. Os nomes das variáveis estão listados abaixo;
não versione esse arquivo.

```bash
npm install
npm run db:deploy    # aplica as migrations
npm run db:seed      # catálogo de exemplo (opcional)
npm run start:dev
```

A API sobe em `http://localhost:3001/api`. Fora de produção, o Swagger fica em
`http://localhost:3001/api/docs` e o health check em
`http://localhost:3001/api/health`.

### 3. Loja

```bash
cd client
npm install
npm run dev
```

A loja sobe em `http://localhost:5173`. Opcionalmente, defina `VITE_API_URL`
para apontar para outra API; o padrão é `http://localhost:3001/api`.

### 4. Painel administrativo

```bash
cd admin
cp .env.example .env.local
npm install
npm run dev
```

O painel sobe em `http://localhost:5174`. `VITE_API_URL` deve apontar para a URL
pública da API (`http://localhost:3001/api` por padrão). A chave administrativa
**não** vai no frontend: ela é digitada no login e trocada por um cookie de
sessão `HttpOnly`.

Adicione `http://localhost:5174` (e a origem da loja, se necessário) em
`CORS_ORIGIN` no `server/.env`.

## Variáveis de ambiente

### `server/.env`

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | URL PostgreSQL usada pela API (role owner). |
| `DIRECT_URL` | sim | URL direta para o Prisma CLI/migrations. |
| `REDIS_HOST` | sim | Host do Redis. |
| `REDIS_PORT` | sim | Porta do Redis. |
| `PORT` | não | Porta da API (padrão `3001`). |
| `NODE_ENV` | não | `development`, `test` ou `production` (padrão `development`). |
| `LOG_LEVEL` | não | Nível do Pino (padrão `info`). |
| `CORS_ORIGIN` | não | Origens permitidas, separadas por vírgula. |
| `ADMIN_API_KEY` | sim | Chave do admin, mínimo de 32 caracteres. |
| `WHATSAPP_NUMBER` | sim | Número do WhatsApp, somente dígitos e com DDI. |
| `SUPABASE_URL` | sim | URL HTTPS do projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | Service role key usada apenas no servidor. |

### Frontends

| Variável | App | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | `client`, `admin` | URL pública da API, incluindo `/api`. |

## Fluxo do pedido

1. O cliente navega pelo catálogo e escolhe tamanho, cor e quantidade.
2. O item entra no carrinho, persistido no `localStorage` (`lookshow:cart`).
3. No carrinho, o cliente clica em **Enviar pedido pelo WhatsApp**.
4. O servidor recalcula preço e estoque (`POST /api/cart/quote`), pois os
   valores do navegador não são confiáveis.
5. Se houver item indisponível, a loja pede revisão e não abre o WhatsApp.
6. O servidor gera a mensagem e o link `wa.me` (`POST /api/cart/whatsapp`).
7. O cliente continua a conversa no WhatsApp para combinar **pagamento** (Pix
   ou cartão) e **entrega** (retirada na loja ou entrega domiciliar em
   Araripe-CE).

Não existe pagamento online, pedido persistido no banco, cálculo de frete nem
reserva de estoque. O carrinho é limpo após o link do WhatsApp abrir com sucesso.

## API em resumo

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/api/products` | Catálogo público, apenas produtos ativos. |
| `GET` | `/api/products/:slug` | Detalhe de produto ativo. |
| `GET` | `/api/categories` | Categorias da loja. |
| `POST` | `/api/cart/quote` | Cotação com preço e estoque reais. |
| `POST` | `/api/cart/whatsapp` | Mensagem e link do pedido no WhatsApp. |
| `POST` | `/api/auth/admin` | Login do painel. |
| `GET` | `/api/admin/products` | Catálogo completo para o painel. |
| `POST/PUT/DELETE` | `/api/products`, `/api/categories` | Manutenção do catálogo, protegida. |
| `POST` | `/api/upload`, `/api/admin/categories/upload` | Upload de imagens. |
| `GET` | `/api/health` | Saúde de PostgreSQL e Redis. |

A lista completa, com filtros e regras, está em
[`server/README.md`](server/README.md).

## Segurança implementada

- CORS com lista explícita de origens e credenciais.
- Helmet/Fastify com headers de segurança.
- Validação global de entrada (`whitelist` e `forbidNonWhitelisted`).
- Rate limit global de 100 requisições/minuto por IP e 5 tentativas de login
  admin por minuto.
- Chave admin comparada em tempo constante; sessão opaca no Redis por 8 horas.
- Cookie `admin_session` `HttpOnly`, `Secure`, `SameSite=Strict`, restrito a
  `/api`.
- Logs com redação de cookies, `Authorization`, `x-api-key`, tokens e remoção de
  query string.
- Erros internos e de Prisma normalizados sem expor detalhes sensíveis.
- Upload limitado a JPG/PNG/WebP, 5 MB, validado por MIME e assinatura dos bytes,
  com nome de arquivo gerado pelo servidor.
- Variáveis de ambiente validadas com Zod na inicialização.

Detalhes em [`server/README.md`](server/README.md).

## Scripts úteis

### API (`server/`)

```bash
npm run start:dev     # desenvolvimento com watch
npm run build         # compilação
npm run lint          # ESLint com correção
npm test              # testes unitários
npm run test:e2e      # testes e2e
npm run db:migrate    # cria/aplica migration em desenvolvimento
npm run db:deploy     # aplica migrations existentes
npm run db:seed       # popula o catálogo de exemplo
npm run db:studio     # Prisma Studio
```

### Loja e painel (`client/`, `admin/`)

```bash
npm run dev
npm run build
npm run lint
npm test
```

## Documentação

- [`server/README.md`](server/README.md) — API, endpoints, regras e segurança.
- [`admin/README.md`](admin/README.md) — painel, funcionalidades e fluxo de uso.
- [`client/README.md`](client/README.md) — loja, fluxo do cliente e entrega local.

## Limitações conhecidas

- **27 vulnerabilidades apenas em dependências de desenvolvimento da API**
  (2 low, 25 moderate, conforme `npm audit` em 07/11/2026).
  `npm audit --omit=dev` retorna 0 vulnerabilidades.
- **Node 20.20.2 no ambiente atual.** O npm 12 avisa que a versão não é
  suportada; migrar para **Node 22 LTS ou 24**.
- **Testes e2e da API usam mocks** de Prisma, Supabase Storage e Redis. Eles
  validam contratos e segurança, mas não substituem um teste de integração com
  PostgreSQL e Redis reais.
- **Pedido não é persistido.** O checkout gera uma mensagem de WhatsApp; não há
  entidade `Order`, painel de pedidos, pagamento online nem reserva de estoque.
  Duas pessoas podem fechar o último item ao mesmo tempo.
- **Entrega não é validada pelo sistema.** Não há CEP, endereço ou cálculo de
  frete; a regra de Araripe-CE é operacional, combinada no atendimento.
- **Categorias públicas:** `GET /api/categories` retorna categorias ativas e
  inativas e conta todos os produtos, inclusive rascunhos/arquivados. O painel
  depende disso hoje; a loja pode exibir uma categoria inativa se ela existir.
- **Upload usa bucket público** no Supabase Storage para que as imagens possam
  ser exibidas na loja.
- **Sem cadastro/login de cliente**, lista de desejos, avaliações ou histórico
  de pedidos.
- **Rate limit em memória por processo.** Com múltiplas instâncias, o limite é
  aplicado separadamente em cada uma.
