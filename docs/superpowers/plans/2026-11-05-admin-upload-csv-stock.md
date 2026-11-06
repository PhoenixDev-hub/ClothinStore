# Plano — Upload de categoria, importação CSV e bloqueio de esgotado

Data: 2026-11-05
Escopo: somente `server/`. Nada em `client/` ou `admin/`.
Ordem: A, B, C — um commit por task.

## Decisões

- **A**: o model `Category` já tem `image String?` e o DTO aceita `image`; não há migration. O endpoint novo só faz upload e devolve a URL. A listagem pública `GET /api/categories` já devolve a categoria inteira, então nada muda nela.
- **A**: extrair a leitura do multipart do `UploadController` para `src/common/multipart.ts` e reutilizar no upload de produto, categoria e importação CSV.
- **B**: CSV chega como `multipart/form-data`, campo `file`. Sem dependência nova: parser próprio para aspas, vírgulas e BOM.
- **B**: categoria é comparada por nome ou slug, sem diferenciar maiúsculas/acentos. Preço aceita `59.90`, `59,90` ou `R$ 59,90` e é convertido para centavos. Estoque vazio = 0.
- **B**: produtos importados entram como `ACTIVE` (importação explícita de catálogo).
- **B**: erros por linha não interrompem as demais; cada linha é criada isoladamente. Cabeçalho inválido responde 400.
- **C**: `withStock` passa a expor `available` (além de `inStock`, mantido). `available = totalStock > 0`.
- **C**: `GET /api/products` continua devolvendo o produto esgotado. `quote` mantém o contrato de item indisponível (`reason: OUT_OF_STOCK`) e ganha `message: "Produto esgotado"`; `whatsapp` responde 400 `"Produto esgotado"` quando só há itens esgotados.
- **C**: `setMaxStock` é código do client (fora do escopo). No servidor nada remove variante com `stock: 0`; um teste garante que a variante continua no resultado.

## Task A — Upload de imagem de categoria

Arquivos:
- `server/src/common/multipart.ts` (novo) — `readMultipartFile(req, field='file')`.
- `server/src/upload/upload.controller.ts` — usa o helper.
- `server/src/upload/category-upload.controller.ts` (novo) — `POST /api/admin/categories/upload` com `@Admin()`.
- `server/src/upload/upload.module.ts` — registra o controller.
- `server/test/api.e2e-spec.ts` — 401 sem credencial; 200 com multipart e `UploadService` mockado; listagem de categorias com `image`.

TDD:
1. Escrever os testes e ver falhar (rota inexistente / 404).
2. Implementar controller + helper.
3. Rodar unit/e2e/build/lint.
4. Commit `feat(server): upload de imagem de categoria`.

## Task B — Importação de produtos via CSV

Arquivos:
- `server/src/products/csv.ts` + `csv.spec.ts` — `parseCsv(text): string[][]`.
- `server/src/products/product-import.service.ts` + spec — validação e criação.
- `server/src/products/admin-products.controller.ts` — `POST import`.
- `server/src/products/dto/import-products-response.dto.ts` — contrato Swagger.
- `server/src/products/products.module.ts` — provider.
- `server/test/api.e2e-spec.ts` — 401 e relatório com Prisma mockado.
- `server/docs/products-example.csv` — exemplo com as 8 colunas.

Regras:
- Cabeçalho obrigatório: `nome, descrição, preço, categoria, tamanho, cor, estoque, imagem` (comparação sem acento/caixa). Faltando → 400.
- Linha válida: nome, descrição, tamanho, cor não vazios; preço > 0; estoque inteiro ≥ 0; categoria existente.
- Resposta: `{ criados: N, erros: [{ linha, motivo }] }`, `linha` 1-based contando o cabeçalho.
- Produto: slug do nome, `images` com a imagem quando informada, `status: ACTIVE`, uma variante com tamanho/cor/estoque.

TDD:
1. Testes do parser e do serviço falhando.
2. Implementar parser + serviço + rota.
3. Rodar testes/build/lint.
4. Commit `feat(server): importacao de produtos via CSV`.

## Task C — Produto esgotado

Arquivos:
- `server/src/products/products.service.ts` — `available` no `withStock`.
- `server/src/cart/cart.service.ts` — `message` para `OUT_OF_STOCK` e erro do WhatsApp.
- `server/src/cart/dto/cart-responses.dto.ts` — campo `message`.
- specs de products/cart + e2e.

TDD:
1. Testes: produto com estoque 0 → `available:false` e variante preservada; quote → `reason/OUT_OF_STOCK` + `message`; whatsapp só com esgotado → 400 "Produto esgotado".
2. Implementar.
3. Rodar testes/build/lint.
4. Commit `fix(server): bloqueia produto esgotado no carrinho`.

## Verificação final

- `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`.
- `curl` 401/200 do upload de categoria (com Supabase real, se configurado).
- `curl` importação com o CSV de exemplo e relatório.
- `curl` quote/whatsapp de SKU com estoque 0.
- Relatar limitações (Supabase real, setMaxStock no client).
