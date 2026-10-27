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
