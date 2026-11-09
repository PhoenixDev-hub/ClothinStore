# Painel administrativo — LookShow

Aplicação independente da loja, feita em **React 19 + Vite 8 + TypeScript**,
para manter o catálogo da LookShow. Consome a API em `server/` e usa sessão por
cookie `HttpOnly`; a chave administrativa nunca fica no navegador.

## Iniciar

```bash
cp .env.example .env.local
npm install
npm run dev
```

- URL local: `http://localhost:5174`
- `VITE_API_URL`: URL pública da API, incluindo `/api`
  (padrão `http://localhost:3001/api`).
- Adicione a origem do painel em `CORS_ORIGIN` no servidor.

Em produção, sirva painel e API por **HTTPS** e no mesmo site registrável: o
cookie de sessão é `Secure` e `SameSite=Strict`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
```

## Login e sessão

1. O operador informa a chave administrativa (`ADMIN_API_KEY`) na tela de login.
2. O frontend envia `POST /api/auth/admin` com `{ apiKey }`.
3. A API valida a chave em tempo constante e responde com o cookie
   `admin_session` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api`, 8 h).
4. A chave é descartada da memória do formulário.
5. Ao abrir o painel, `GET /api/auth/admin/me` valida a sessão. Sem sessão, o
   usuário é redirecionado para `/login`.
6. **Sair** chama `POST /api/auth/admin/logout`, revoga a sessão no Redis e
   limpa o cookie.

O login tem limite de 5 tentativas por minuto por IP. Erros exibidos:

- `401`: chave inválida.
- `429`: muitas tentativas; aguardar um minuto.
- Falha de rede: mensagem genérica de conexão.

## Rotas

| Rota | Tela |
| --- | --- |
| `/login` | Login com chave administrativa. |
| `/dashboard` | Resumo do catálogo e do estoque. |
| `/produtos` | Lista, filtros, ordenação, arquivamento e exclusão. |
| `/produtos/novo` | Cadastro de produto. |
| `/produtos/:id/editar` | Edição de produto. |
| `/produtos/importar` | Importação de produtos por CSV. |
| `/categorias` | Cadastro, edição e exclusão de categorias. |

Rotas desconhecidas redirecionam para `/dashboard`.

## Funcionalidades

### Dashboard

Carrega todos os produtos administrativos e todas as categorias e mostra:

- total de produtos;
- total de categorias;
- produtos **esgotados** (`totalStock = 0`);
- produtos com **estoque baixo** (`totalStock` entre 1 e 4).

Há atalhos para produtos, categorias e importação. Em caso de erro de rede, a
tela oferece nova tentativa.

### Produtos

- Lista produtos de **todos os status**: rascunho, ativo e arquivado.
- Busca por nome.
- Filtro por status.
- Filtro **somente esgotados**.
- Ordenação por nome, preço ou estoque, crescente ou decrescente.
- Paginação local de 20 itens.
- Ações: editar, arquivar/reativar e excluir, com confirmação.
- Importação de CSV também disponível como modal nesta tela.

Para filtros e estatísticas, o painel baixa o catálogo inteiro em páginas de
100 itens. É um atalho conhecido para catálogos pequenos; com muitos produtos,
o ideal é mover filtros e contagens para o servidor.

### Editor de produto

Campos:

- nome, slug, descrição;
- preço em reais (convertido para centavos);
- categoria;
- status (`DRAFT`, `ACTIVE`, `ARCHIVED`);
- imagens por URL ou upload;
- variantes com SKU, tamanho, cor, cor em hexadecimal, estoque e disponibilidade.

Regras da tela:

- Nome, slug, descrição, preço maior que zero, categoria e ao menos uma imagem
  são obrigatórios.
- O slug é sugerido a partir do nome, mas pode ser editado.
- O SKU da variante é opcional; o campo é preenchido automaticamente pelo painel
  e o servidor gera um SKU se ele não for enviado.
- A cor hexadecimal é sugerida a partir do nome da cor; sem correspondência, o
  seletor mostra `#111111` como padrão visual.
- Salvar com variantes **substitui todas** as variantes existentes no servidor.
- Mudar o status de um produto existente para `ARCHIVED` pede confirmação.
- Produto novo começa como rascunho, mas o status pode ser alterado antes de
  salvar.
- Upload de imagem aceita JPG, PNG ou WebP até 5 MB; a imagem é enviada para
  `POST /api/upload` e a URL retornada entra na lista de imagens.

### Categorias

- Lista todas as categorias, com busca e paginação local de 20 itens.
- Cadastro e edição com nome, slug, descrição, imagem, posição, categoria pai e
  `isActive`.
- O slug é sugerido a partir do nome.
- Imagem por URL ou upload em `POST /api/admin/categories/upload`.
- Exclusão com confirmação.
- A API bloqueia exclusão de categoria que possui produtos e impede ciclos na
  árvore de categorias.

### Importação CSV

- Envia `multipart/form-data` para `POST /api/admin/products/import`.
- Colunas: `nome`, `descrição`, `preço`, `categoria`, `tamanho`, `cor`,
  `estoque`, `imagem`; `sku` é opcional.
- Cada linha válida cria um produto `ACTIVE` com uma variante.
- Linhas inválidas aparecem no relatório com número da linha e motivo, sem
  interromper as demais.
- A categoria precisa existir antes da importação.
- Exemplo para download: `/products-example.csv`.

## Fluxo operacional sugerido

1. Entrar em `/login` com a chave administrativa.
2. Conferir o dashboard (esgotados e estoque baixo).
3. Criar ou atualizar categorias.
4. Cadastrar produtos e variantes, ou importar um CSV.
5. Enviar imagens pelo editor.
6. Publicar o produto mudando o status para `ACTIVE`.
7. Acompanhar o estoque pelo dashboard e pela lista de produtos.

O painel **não** gerencia pedidos, pagamentos ou entregas: o pedido é fechado no
WhatsApp, fora do sistema.

## Limitações conhecidas

- O catálogo inteiro é carregado para filtros e estatísticas locais.
- Não há tela de pedidos, relatórios financeiros, usuários ou permissões
  granulares; existe uma única chave administrativa.
- Não há histórico de alterações nem exclusão reversível.
- A lista de categorias inclui categorias inativas, pois usa o endpoint público
  `GET /api/categories`.
- O painel não valida CEP nem endereço; entrega e pagamento são combinados no
  atendimento.
- A sessão depende do Redis; se ele cair, o login e a validação retornam `503`.
