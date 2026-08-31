-- Rode isso inteiro no SQL Editor do Supabase (Project → SQL Editor → New query → Run)

create table if not exists menu (
  id text primary key,
  cat text not null,
  name text not null,
  description text,
  price numeric not null,
  emoji text,
  tag text,
  available boolean default true,
  image_url text
);

-- Se a tabela já existia antes desta atualização, rode só esta linha:
-- alter table menu add column if not exists image_url text;

alter table menu enable row level security;

-- Qualquer pessoa pode ler o cardápio (necessário para o site funcionar)
create policy "Leitura pública do cardápio" on menu
  for select using (true);

-- Qualquer pessoa com a chave anônima pode escrever — a proteção real
-- é o código de acesso (1234) na tela "Área da loja" do site, não o banco.
-- Se quiser reforçar isso depois, dá pra trocar essas políticas por uma
-- autenticação de verdade no Supabase.
create policy "Escrita no cardápio" on menu
  for insert with check (true);
create policy "Atualização no cardápio" on menu
  for update using (true);
create policy "Remoção no cardápio" on menu
  for delete using (true);

-- Cardápio inicial (o mesmo que já estava no site)
insert into menu (id, cat, name, description, price, emoji, tag, available) values
  ('c1', 'Combos', 'Combo Prime Duplo', 'Burger duplo smash, fritas média e refrigerante 350ml', 39.9, '🍔', 'Mais pedido', true),
  ('c2', 'Combos', 'Combo Bacon Fire', 'Burger bacon defumado, onion rings e suco natural', 42.9, '🥓', null, true),
  ('l1', 'Hambúrguer', 'Prime Clássico', 'Brioche, blend 160g, queijo prato, alface, tomate e molho da casa', 24.9, '🍔', 'Mais pedido', true),
  ('l2', 'Hambúrguer', 'Bacon Fire', 'Blend 160g, bacon crocante, cheddar e molho barbecue defumado', 28.9, '🔥', 'Picante', true),
  ('l3', 'Hambúrguer', 'Duplo Smash', 'Dois blends smash 90g, queijo derretido e picles', 27.9, '🧀', null, true),
  ('l4', 'Hambúrguer', 'Frango Crocante', 'Peito de frango empanado, maionese de ervas e alface americana', 23.9, '🍗', 'Novo', true),
  ('l5', 'Hambúrguer', 'Veggie Prime', 'Hambúrguer de grão-de-bico, rúcula, tomate seco e maionese vegana', 25.9, '🥬', 'Veggie', true),
  ('p1', 'Porções', 'Fritas da Casa', 'Porção generosa com sal e ervas, sirva 2 pessoas', 18.9, '🍟', null, true),
  ('p2', 'Porções', 'Onion Rings', 'Anéis de cebola empanados, crocantes por fora', 21.9, '🧅', null, true),
  ('p3', 'Porções', 'Frango na Brasa', 'Tirinhas de frango grelhado com molho especial', 26.9, '🍢', null, true),
  ('b1', 'Bebidas', 'Refrigerante Lata', '350ml — Coca, Guaraná ou Fanta', 6.9, '🥤', null, true),
  ('b2', 'Bebidas', 'Suco Natural', '500ml — laranja, limão ou maracujá', 9.9, '🍹', null, true),
  ('b3', 'Bebidas', 'Milkshake Prime', 'Chocolate, morango ou baunilha, 400ml', 15.9, '🥛', null, true),
  ('s1', 'Pastel', 'Brownie com Sorvete', 'Brownie quente, sorvete de creme e calda de chocolate', 16.9, '🍫', null, true),
  ('s2', 'Pastel', 'Petit Gateau', 'Bolinho de chocolate com recheio cremoso e sorvete', 18.9, '🍰', 'Mais pedido', true)
on conflict (id) do nothing;
