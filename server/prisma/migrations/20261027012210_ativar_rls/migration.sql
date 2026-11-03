-- RLS do Supabase. Importante: a API acessa o banco via Prisma com a role
-- owner (DATABASE_URL), que NÃO é filtrada por RLS. A autorização real da API
-- é feita nos controllers/guards; estas policies valem apenas para o
-- PostgREST/anon. Ver "Segurança" no README do server.
--
-- Em Postgres local (docker-compose) as roles anon/authenticated não existem.
-- Sem o guard abaixo, GRANT ... TO anon quebra a migration em banco limpo.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE NOTICE 'roles anon/authenticated ausentes; RLS do Supabase nao aplicada';
    RETURN;
  END IF;

  -- 1. Acesso ao schema (necessário para o PostgREST resolver as tabelas)
  GRANT USAGE ON SCHEMA public TO anon, authenticated;

  -- 2. Habilita RLS nas tabelas da aplicação
  ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Product"  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Variant"  ENABLE ROW LEVEL SECURITY;

  -- 3. Privilégio de SELECT
  --    Sem o GRANT o PostgREST falha com "permission denied" antes de avaliar
  --    qualquer policy.
  GRANT SELECT ON "Category" TO anon, authenticated;
  GRANT SELECT ON "Product"  TO anon, authenticated;
  GRANT SELECT ON "Variant"  TO anon, authenticated;

  -- 4. Policies de leitura pública
  CREATE POLICY "categorias_ativas_sao_publicas"
    ON "Category"
    FOR SELECT
    TO anon, authenticated
    USING ("isActive" = true);

  CREATE POLICY "produtos_ativos_sao_publicos"
    ON "Product"
    FOR SELECT
    TO anon, authenticated
    USING ("status" = 'ACTIVE');

  CREATE POLICY "variantes_disponiveis_de_produtos_ativos"
    ON "Variant"
    FOR SELECT
    TO anon, authenticated
    USING (
      "available" = true
      AND EXISTS (
        SELECT 1
        FROM "Product" p
        WHERE p."id" = "Variant"."productId"
          AND p."status" = 'ACTIVE'
      )
    );
END
$$;
