# API — Loja de Roupas

## Segurança

- **RLS não é a camada de autorização da API.** A API conecta via Prisma com a
  role owner (`DATABASE_URL`), que ignora Row Level Security. As policies da
  migration `20261027012210_ativar_rls` valem apenas para acesso direto via
  PostgREST/`anon` no Supabase; a autorização real é feita nos controllers e no
  `AdminApiKeyGuard`.
- A migration de RLS só é aplicada quando as roles `anon` e `authenticated`
  existem. Em Postgres local (docker-compose) ela é ignorada, para que um banco
  limpo possa ser migrado sem erro.
- O `docker-compose.yml` exige `POSTGRES_PASSWORD` no ambiente antes de iniciar
  o Postgres. Use uma senha local forte e exclusiva; as portas de Postgres e
  Redis ficam acessíveis apenas pelo próprio computador.
- Ao alterar uma migration já aplicada, o Prisma acusa checksum divergente. Em
  banco de desenvolvimento, recrie-o; em banco com dados, use
  `prisma migrate resolve` conforme o caso.

## Painel admin

- O app separado fica em `admin/` e usa `VITE_API_URL` somente para a URL pública
  da API. A chave `ADMIN_API_KEY` fica configurada apenas no servidor e é enviada
  ao `POST /api/auth/admin` no momento do login; o servidor nunca a devolve.
- O login valida a chave em tempo constante e cria uma sessão opaca no Redis por
  oito horas. O cookie `admin_session` é `HttpOnly`, `Secure` e `SameSite=Strict`;
  logout o revoga e limpa o cookie. As sessões falham fechadas se o Redis cair.
- Configure `CORS_ORIGIN` como uma lista separada por vírgulas com cada origem
  autorizada, incluindo a origem do painel. O padrão local inclui
  `http://localhost:5174`; CORS permite credenciais somente para origens listadas.
- Em produção, sirva painel e API em HTTPS e sob o mesmo site registrável para
  que `SameSite=Strict` envie o cookie. Não coloque a chave em variáveis `VITE_*`.
- Rotas de sessão: `POST /api/auth/admin`, `POST /api/auth/admin/logout` e
  `GET /api/auth/admin/me`. O login aceita no máximo cinco tentativas por minuto
  por IP. O contrato Swagger inclui autenticação por cookie e `x-api-key` em
  `/api/docs` fora de produção.
- O catálogo admin lê `GET /api/admin/products` e usa os endpoints existentes
  `POST`, `PUT` e `DELETE /api/products`; categorias e upload usam
  `/api/categories` e `/api/upload`.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
