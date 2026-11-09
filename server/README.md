# API — LookShow

API REST da loja LookShow, construída com **NestJS 11 + Fastify 5 + Prisma 7**
sobre **PostgreSQL**, com **Redis** para sessões admin e cache, e **Supabase
Storage** para imagens.

- Prefixo global: `/api`
- URL local: `http://localhost:3001/api`
- Swagger (fora de produção): `http://localhost:3001/api/docs`
- Health check: `http://localhost:3001/api/health`

## Stack

| Item | Uso |
| --- | --- |
| NestJS + Fastify | HTTP, validação, guards, filtros, Swagger |
| Prisma 7 | Modelagem e acesso ao PostgreSQL |
| PostgreSQL 17 | Banco principal |
| Redis 7 | Sessões admin e cache de catálogo |
| Supabase Storage | Upload de imagens em bucket público |
| Pino (`nestjs-pino`) | Logs estruturados com redação |
| Zod | Validação das variáveis de ambiente |
| `class-validator` | Validação dos DTOs |
| `@nestjs/throttler` | Rate limit |

## Configuração

```bash
cp .env.example .env
npm install
npm run db:deploy
npm run db:seed
npm run start:dev
```

| Variável | Obrigatória | Regra |
| --- | --- | --- |
| `DATABASE_URL` | sim | URL `postgresql://` ou `postgres://`. |
| `DIRECT_URL` | sim | URL direta para migrations. |
| `REDIS_HOST` | sim | Texto não vazio. |
| `REDIS_PORT` | sim | Inteiro de 1 a 65535. |
| `PORT` | não | Inteiro de 1 a 65535; padrão `3001`. |
| `NODE_ENV` | não | `development`, `test` ou `production`; padrão `development`. |
| `LOG_LEVEL` | não | `fatal`, `error`, `warn`, `info`, `debug`, `trace` ou `silent`. |
| `CORS_ORIGIN` | não | Origens separadas por vírgula; padrão `http://localhost:5173,http://localhost:5174`. |
| `ADMIN_API_KEY` | sim | Mínimo de 32 caracteres. |
| `WHATSAPP_NUMBER` | sim | 10 a 15 dígitos, com DDI. |
| `SUPABASE_URL` | sim | URL HTTPS. |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | Texto não vazio. |

A API não inicia se alguma variável obrigatória estiver inválida ou ausente.

### Banco e seed

```bash
npm run db:migrate    # desenvolvimento: cria/aplica migration
npm run db:deploy     # aplica migrations existentes
npm run db:seed       # 8 produtos e 4 categorias de exemplo
npm run db:studio     # Prisma Studio
```

O seed é uma fixture de desenvolvimento: executa `TRUNCATE` em `Product` e
`Category`, reinicia os IDs e recria o catálogo de exemplo. **Não rode o seed em
banco com dados reais.**

### Redis e cache

- O cache de catálogo usa Redis quando disponível e cai para memória se a
  conexão falhar, registrando um aviso.
- As sessões administrativas **não** têm fallback: se o Redis estiver fora, o
  login e a validação de sessão respondem `503`.
- O `/api/health` testa PostgreSQL e Redis e retorna `ok` ou `degraded`.

## Autenticação

Rotas marcadas com `@Admin()` aceitam **uma** das duas credenciais:

1. Header `x-api-key` com o valor de `ADMIN_API_KEY`; ou
2. Cookie de sessão `admin_session`, criado pelo login do painel.

O painel usa o fluxo de sessão. A chave nunca é devolvida ao navegador nem
armazenada pelo frontend.

### Endpoints de sessão

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/admin` | Valida `{ "apiKey": "..." }`, cria sessão de 8 h e define o cookie. |
| `POST` | `/api/auth/admin/logout` | Revoga a sessão e limpa o cookie. Retorna `204`. |
| `GET` | `/api/auth/admin/me` | Valida a sessão atual. Protegido. |

Detalhes de segurança:

- A chave é comparada com SHA-256 e `timingSafeEqual`.
- O token de sessão tem 32 bytes aleatórios em base64url.
- A sessão fica no Redis com TTL de 8 horas.
- O cookie é `HttpOnly`, `Secure`, `SameSite=Strict` e `Path=/api`.
- O login tem limite de **5 tentativas por minuto por IP**.
- Redis indisponível resulta em `503`, não em sessão válida (falha fechada).
- Em produção, sirva painel e API em HTTPS e no mesmo site registrável para que
  o cookie `SameSite=Strict` seja enviado.

## Formato das respostas

Listagens paginadas:

```json
{
  "data": [],
  "meta": { "total": 0, "page": 1, "limit": 12, "totalPages": 0 }
}
```

Erros:

```json
{
  "statusCode": 400,
  "message": "Mensagem legível",
  "error": "Bad Request",
  "timestamp": "2026-11-07T12:00:00.000Z",
  "path": "/api/products"
}
```

Erros de Prisma conhecidos são mapeados para `400`, `404`, `409`, `503` etc.
Erros inesperados retornam apenas `Erro interno do servidor`; o detalhe fica no
log. A query string é removida dos logs e das respostas de erro.

## Endpoints públicos

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api` | Retorna a mensagem inicial da API. |
| `GET` | `/api/health` | Verifica PostgreSQL e Redis. Ignora rate limit. |
| `GET` | `/api/products` | Lista produtos `ACTIVE`, paginados. |
| `GET` | `/api/products/:slug` | Busca um produto `ACTIVE` pelo slug. |
| `GET` | `/api/categories` | Lista todas as categorias com contagem de produtos. |
| `POST` | `/api/cart/quote` | Cotação do carrinho com preço e estoque do banco. |
| `POST` | `/api/cart/whatsapp` | Gera mensagem e link `wa.me` do pedido. |

### `GET /api/products`

Query params:

| Parâmetro | Descrição |
| --- | --- |
| `page` | Página, a partir de 1. Padrão `1`. |
| `limit` | Itens por página, de 1 a 100. Padrão `12`. |
| `category` | Slug da categoria. Inclui produtos das subcategorias diretas. |
| `size` | Tamanho exato em alguma variante. |
| `color` | Cor exata em alguma variante. |
| `inStock` | `true` para exigir variante `available` com `stock > 0`. |
| `minPrice` | Preço mínimo em centavos. |
| `maxPrice` | Preço máximo em centavos. |
| `search` | Busca por nome, marca ou tag. |
| `status` | Aceito, mas **ignorado**: a listagem pública sempre retorna `ACTIVE`. |

Cada produto inclui `category`, `variants`, `totalStock`, `inStock` e
`available`. `totalStock` soma o estoque das variantes `available`.
A ordenação é `isFeatured` descendente e depois `createdAt` descendente.

### `GET /api/products/:slug`

Retorna somente produto `ACTIVE`. Produto inexistente ou não ativo responde
`404`.

### `GET /api/categories`

Retorna **todas** as categorias (ativas e inativas), ordenadas por `position` e
`name`, com `_count.products`. A contagem inclui produtos de qualquer status.
Não há paginação nem autenticação.

### `POST /api/cart/quote`

```json
{
  "items": [{ "sku": "CAM-BAS-M-BRANCO", "quantity": 2 }]
}
```

Regras:

- De 1 a 50 itens; `quantity` inteiro a partir de 1.
- SKUs repetidos são somados em uma única linha.
- O preço unitário vem do banco: `variant.price ?? product.price`.
- A resposta contém `items`, `availableItems`, `unavailableItems`, `subtotal` e
  `total`, todos em centavos.
- `total` é igual ao subtotal; não há frete nem desconto.
- Motivos de indisponibilidade: `NOT_FOUND`, `UNAVAILABLE` (variante inativa ou
  produto não `ACTIVE`), `OUT_OF_STOCK` e `INSUFFICIENT_STOCK`.
- Itens indisponíveis têm `subtotal: 0`, `maxStock: 0` e, quando aplicável,
  `message`.

### `POST /api/cart/whatsapp`

Recebe o mesmo payload da cotação, recalcula tudo no servidor e retorna:

```json
{
  "message": "Olá! Quero comprar:\n- 2x Camiseta (M, Branco) — R$ 119,80\n\nTotal: R$ 119,80",
  "whatsappUrl": "https://wa.me/5585999999999?text=..."
}
```

- Inclui apenas itens disponíveis na mensagem.
- Usa `WHATSAPP_NUMBER` e formata valores em BRL.
- Se nenhum item estiver disponível, responde `400` com `Produto esgotado`
  (quando há item sem estoque) ou `Nenhum item disponível para compra`.
- Não cria pedido no banco, não baixa estoque e não reserva itens.

## Produtos e variantes

### Status

- `DRAFT`: rascunho, visível apenas no admin.
- `ACTIVE`: visível na loja e vendável.
- `ARCHIVED`: arquivado, visível apenas no admin.

### Regras

- Slugs usam apenas minúsculas, números e hífens.
- `price` e `compareAtPrice` são inteiros em centavos; `price` mínimo 1.
- Todo produto precisa de pelo menos uma imagem e uma categoria existente.
- `isNew` padrão é `true` na criação, alimentando a seção de novidades.
- `isFeatured` define destaque na ordenação e na home.
- Variantes têm `sku` único, `size`, `color`, `stock >= 0`, `available` e
  `price` opcional.
- Se o `sku` não for enviado, o servidor gera um SKU a partir de categoria,
  slug, cor e tamanho, adicionando sufixo numérico em caso de colisão.
- A combinação `productId + size + color` é única.
- Em `PUT /api/products/:id`, enviar `variants` **substitui todas** as
  variantes existentes em transação. Enviar lista vazia remove todas.
- Se `categoryId`, `slug` ou `sku` entrarem em conflito, a API responde `409`.
- Remover produto apaga suas variantes em cascata.

### Cache

- Listagens e busca por slug ficam em cache por **5 minutos**.
- Escritas de produto/categoria incrementam a versão da lista e limpam o slug
  afetado.
- O cache usa Redis quando disponível; sem Redis, usa memória.

## Categorias

- Estrutura em árvore via `parentId`.
- `slug` único, apenas minúsculas, números e hífens.
- `position` define a ordem; `isActive` controla a visibilidade no banco.
- Alterar `parentId` valida ciclos percorrendo a árvore.
- Remover categoria com produtos vinculados responde `409`.
- A API pública atualmente **não filtra** `isActive` em `GET /api/categories`.

## Admin de produtos

Todas as rotas abaixo exigem `@Admin()`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/admin/products` | Lista produtos de qualquer status. |
| `GET` | `/api/admin/products/:id` | Busca produto por ID, qualquer status. |
| `POST` | `/api/admin/products/import` | Importa produtos via CSV. |
| `POST` | `/api/products` | Cria produto com variantes. |
| `PUT` | `/api/products/:id` | Atualiza produto; `variants` substitui todas. |
| `DELETE` | `/api/products/:id` | Remove produto e variantes. |
| `POST` | `/api/categories` | Cria categoria. |
| `PUT` | `/api/categories/:id` | Atualiza categoria. |
| `DELETE` | `/api/categories/:id` | Remove categoria sem produtos. |

`GET /api/admin/products` aceita os mesmos filtros da listagem pública, mais
`status`. Não usa cache.

## Importação CSV

`POST /api/admin/products/import` recebe `multipart/form-data` no campo `file`.
O limite global de multipart é de **5 MB**.

- Colunas obrigatórias (sem diferenciar maiúsculas/acentos):
  `nome`, `descrição`, `preço`, `categoria`, `tamanho`, `cor`, `estoque`,
  `imagem`.
- `sku` é opcional; se ausente, é gerado pelo servidor.
- Preço aceita `59.90`, `59,90` ou `R$ 59,90`.
- A categoria precisa existir; a importação **não cria categorias**. Ela é
  encontrada por nome ou slug.
- Cada linha válida cria um produto `ACTIVE` com **uma** variante e `isNew`.
- Linhas inválidas não interrompem as demais; voltam em `erros` com número da
  linha (1-based, contando o cabeçalho) e motivo.
- Linhas vazias são ignoradas.
- Conflito de slug ou SKU é reportado como erro da linha.
- CSV vazio ou sem coluna obrigatória responde `400`.

Exemplo: [`docs/products-example.csv`](docs/products-example.csv).

Resposta:

```json
{
  "criados": 2,
  "erros": [{ "linha": 3, "motivo": "Categoria \"Inexistente\" não encontrada" }]
}
```

## Upload de imagens

| Método | Rota | Uso |
| --- | --- | --- |
| `POST` | `/api/upload` | Imagem de produto. Retorna `201`. |
| `POST` | `/api/admin/categories/upload` | Imagem de categoria. Retorna `200`. |

Ambas exigem `@Admin()` e recebem `multipart/form-data` no campo `file`.

Validações:

- Formatos aceitos: **JPG, PNG e WebP**.
- Tamanho máximo: **5 MB**.
- O tipo declarado é conferido e os **bytes são inspecionados** para confirmar a
  assinatura real do formato.
- O nome do arquivo é gerado pelo servidor (`ano/mês/UUID.ext`), sem usar o nome
  enviado pelo cliente; isso elimina path traversal por nome de arquivo.
- O bucket `product-images` é criado automaticamente como público, com limite de
  5 MB e os MIME types permitidos.
- A resposta é `{ "url": "...", "path": "..." }`; use a URL em `images` do
  produto ou `image` da categoria.
- Falha do Supabase responde `502`.

## Segurança

- **CORS:** apenas as origens listadas em `CORS_ORIGIN`; credenciais habilitadas.
- **Headers:** Helmet registrado no Fastify. CSP não força upgrade para HTTPS em
  desenvolvimento para não quebrar o Swagger local; HSTS continua ativo.
- **Validação:** `ValidationPipe` global com `transform`, `whitelist` e
  `forbidNonWhitelisted`; campos desconhecidos são rejeitados.
- **Rate limit:** 100 requisições por minuto por IP no geral; 5 por minuto no
  login admin; `/health` ignora o limite.
- **Logs:** Pino redige `Authorization`, `x-api-key`, cookies, `set-cookie`,
  `apiKey`, `password`, `token`, `accessToken`, `refreshToken` e tokens na query.
  A query string é removida da URL logada.
- **Erros:** formato único, sem stack trace ou detalhes internos na resposta.
- **Request ID:** usa `x-request-id` recebido ou gera um UUID e devolve no header.
- **Ambiente:** Zod valida todas as variáveis obrigatórias no boot.
- **SQL:** acesso via Prisma com queries parametrizadas.
- **RLS:** as policies da migration `20261027012210_ativar_rls` valem para
  acesso direto via PostgREST/`anon`. A API conecta com a role owner
  (`DATABASE_URL`), que **ignora RLS**; a autorização real está nos controllers
  e no `AdminApiKeyGuard`. Em PostgreSQL local, a migration ignora o bloco
  quando as roles `anon`/`authenticated` não existem.

## Testes

```bash
npm test          # unitários (Jest)
npm run test:e2e  # e2e (Jest + Supertest)
npm run test:cov
```

Os testes e2e montam a aplicação Nest com Prisma, Supabase Storage e Redis
mockados; não exigem PostgreSQL nem Redis reais. Eles cobrem contratos das
rotas, autenticação, CORS, headers, validação de upload, importação CSV, erros e
rate limit do login.

## Limitações conhecidas

- 27 vulnerabilidades em dependências **de desenvolvimento** (2 low, 25 moderate
  em `npm audit`); produção (`--omit=dev`) tem 0.
- Node 20.20.2 no ambiente atual; npm 12 recomenda Node 22 ou 24.
- Sem entidade de pedido, pagamento online, cálculo de frete, endereço ou
  reserva de estoque.
- `GET /api/categories` não filtra categorias inativas e conta produtos de todos
  os status.
- Bucket de imagens é público por necessidade de exibição na loja.
- Rate limit em memória por processo; múltiplas instâncias não compartilham a
  contagem.
- Swagger desativado quando `NODE_ENV=production`.
