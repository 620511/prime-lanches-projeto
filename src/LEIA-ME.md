# JARVIS — excluir pedidos + relatório de vendas

## 1) Por que não dava pra excluir pedido

Faltavam duas coisas: a permissão no banco (Supabase) e o botão no
painel. As duas foram adicionadas.

### Rodar no Supabase primeiro
No SQL Editor, rode o `supabase-add-delete-pedidos.sql`. Sem isso, o
botão de excluir aparece mas dá erro (a política de segurança do
banco ainda bloqueia o delete).

### O que mudou no código
- `menuApi.js`: nova função `deleteOrder(id)`
- `App.jsx`: cada pedido no painel agora tem um botão de lixeira
  🗑️ ao lado do botão do WhatsApp — clica, confirma, e some (do
  painel e do banco).

## 2) Relatório de vendas (dia / semana / mês)

Apareceu um quadro **"📊 Relatório de vendas"** no painel, entre o
código de acesso e a lista de pedidos, com três cartões:
- **Hoje**
- **Esta semana** (segunda a domingo)
- **Este mês**

Cada um mostra: faturamento, quantidade de pedidos e ticket médio.
Pedidos cancelados não entram na conta.

O JARVIS também responde isso pelo quadro "Perguntar ao JARVIS" (ou
por voz), com perguntas tipo:
- "quanto vendeu hoje" / "relatório do dia"
- "vendas da semana"
- "vendas do mês" / "faturamento do mês"

## Como aplicar

1. Rode o `supabase-add-delete-pedidos.sql` no Supabase.
2. Substitua `src/App.jsx` e `src/menuApi.js` pelos deste pacote.
3. `npm run dev`, entra na Área da loja (2030), confere:
   - O quadro de relatório aparece com os números certos
   - O botão de lixeira exclui um pedido de teste
   - Pergunta "quanto vendeu hoje" pro JARVIS
