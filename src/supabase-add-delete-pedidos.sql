-- ============================================================
-- Libera a exclusão de pedidos no painel da loja.
-- Hoje só existiam políticas de criar/ler/atualizar — faltava
-- a de excluir, por isso o botão de apagar não funcionava.
-- Rode isso no SQL Editor do Supabase.
-- ============================================================

drop policy if exists "Excluir pedidos" on orders;
create policy "Excluir pedidos" on orders
  for delete using (true);
