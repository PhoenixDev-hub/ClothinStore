# Loja virtual — LookShow

Frontend da loja de roupas femininas da LookShow, em **React 19 + Vite 8 +
TypeScript**. Exibe o catálogo, monta o carrinho e envia o pedido pelo
**WhatsApp**. Não processa pagamento nem coleta endereço.

## Iniciar

```bash
npm install
npm run dev
```

- URL local: `http://localhost:5173`
- API padrão: `http://localhost:3001/api`
- Para apontar para outra API, defina `VITE_API_URL` (incluindo `/api`).

Não há arquivo `.env.example` neste app; a variável é opcional e possui valor
padrão no código.

## Stack

| Item | Uso |
| --- | --- |
| React 19 + Vite 8 | SPA |
| TypeScript | Tipagem |
| React Router 7 | Rotas |
| TanStack Query 5 | Cache e estado de requisições |
| Zustand 5 + `persist` | Carrinho no `localStorage` |
| Axios | Cliente HTTP |
| Tailwind CSS 4 | Estilos |
| Sonner | Toasts |
| Radix UI | Componentes acessíveis (sheet, slot) |

## Rotas

| Rota | Tela |
| --- | --- |
| `/` | Home com destaques, novidades e categorias. |
| `/produtos` | Catálogo com filtros e paginação. |
| `/produto/:slug` | Detalhe do produto. |
| `/carrinho` | Carrinho e envio do pedido. |
| `*` | Página de não encontrado. |

## Fluxo do cliente

1. **Home:** mostra produtos em destaque e novidades, além das categorias.
2. **Catálogo:** lista produtos ativos com filtros por categoria, tamanho, cor,
   faixa de preço e busca por texto. Os filtros ficam na URL, o que permite
   compartilhar ou recarregar a página mantendo o estado. A paginação é de 12
   itens.
3. **Detalhe:** galeria de imagens, preço, preço comparativo, desconto, tamanhos
   e cores disponíveis, limite de quantidade pelo estoque e produtos
   relacionados da mesma categoria.
4. **Carrinho:** itens persistidos no `localStorage` com a chave
   `lookshow:cart`; é possível alterar quantidade ou remover. O total exibido é
   uma prévia calculada com o preço unitário salvo no navegador.
5. **Envio:** ao clicar em **Enviar pedido pelo WhatsApp**, a loja:
   - pede ao servidor a cotação real (`POST /api/cart/quote`);
   - atualiza o estoque máximo de cada item;
   - bloqueia o envio e pede revisão se algum item estiver indisponível;
   - solicita a mensagem e o link do WhatsApp (`POST /api/cart/whatsapp`);
   - valida que o link é `https://wa.me/...`;
   - abre o WhatsApp em uma nova aba;
   - limpa o carrinho somente após a abertura bem-sucedida.

Se o navegador bloquear o pop-up, o carrinho é mantido e a loja orienta a
liberar pop-ups e tentar novamente.

## Entrega e pagamento

- Entrega **apenas em Araripe-CE**.
- **Retirada na loja** ou **entrega na casa do cliente** (motoboy).
- Pagamento combinado no WhatsApp: **Pix ou cartão**.
- O site não pede endereço, não calcula frete e não valida CEP; essas
  informações são tratadas no atendimento.
- A tela de produto informa: “Envio para a localidade ou retirada na loja” e
  “Pedido confirmado pelo WhatsApp”.
- O rodapé resume o fluxo: escolher peças, revisar o carrinho, enviar pelo
  WhatsApp e combinar pagamento e entrega.

## Regras de preço e estoque

- Preços são exibidos em BRL, mas trafegam em **centavos** na API.
- A loja nunca confia no preço do `localStorage`: o servidor recalcula tudo na
  cotação e novamente ao gerar o link do WhatsApp.
- Variantes com `available = false` ou `stock = 0` não aparecem como opção de
  compra.
- A quantidade máxima de cada item é limitada pelo estoque da variante.
- A cotação pode retornar `NOT_FOUND`, `UNAVAILABLE`, `OUT_OF_STOCK` ou
  `INSUFFICIENT_STOCK`; a loja traduz esses motivos em mensagens e impede o
  envio até a revisão.
- O total do carrinho é apenas subtotal; frete e pagamento são combinados no
  atendimento.

## Estados de interface

- Esqueletos de carregamento no catálogo e no detalhe.
- Mensagens de erro com botão de nova tentativa.
- Estado vazio para catálogo sem resultados, carrinho vazio e produto
  inexistente.
- Layout responsivo, com filtros em painel lateral no desktop e em sheet no
  mobile.
- Navegação por teclado, `aria-label`, `aria-pressed` e textos alternativos nas
  imagens.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
```

`npm run build` roda a checagem TypeScript e o build do Vite. Os testes usam
Vitest e cobrem cliente HTTP, carrinho, dinheiro, produto e utilidades.

## Limitações conhecidas

- **Não há checkout transacional nem pagamento online.** O pedido é uma
  mensagem enviada pelo WhatsApp.
- **Não há cadastro/login de cliente**, endereço, histórico de pedidos, lista de
  desejos ou avaliações.
- **Não há reserva de estoque.** O estoque é conferido na cotação, mas outra
  pessoa pode comprar o mesmo item antes do atendimento.
- **Entrega local não é validada pelo sistema.** A regra de Araripe-CE depende
  do atendimento humano.
- **Categorias inativas podem aparecer** na navegação, porque a API pública
  retorna todas as categorias.
- As opções de cor do filtro são montadas com os produtos da página atual; em
  catálogos grandes, cores de outras páginas podem não aparecer no filtro.
- O carrinho fica no navegador: limpar os dados do site o apaga.
