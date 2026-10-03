# Prime Lanches + JARVIS — pacote completo

Esses três arquivos juntos têm tudo que já construímos até agora.
Testei o build de produção de verdade com os três juntos antes de
mandar — passou limpo.

## O que tem aqui

- `App.jsx`
- `menuApi.js`
- `main.jsx` (esse é NOVO — a pasta src pode não ter esse arquivo
  ainda, ou ter uma versão mais simples. Substitui mesmo assim.)

## Funcionalidades incluídas

- Cardápio, carrinho, checkout (como sempre)
- Pedido salvo no Supabase antes do WhatsApp (WhatsApp só confirma
  forma de pagamento)
- Troco no pagamento em dinheiro (pergunta ao cliente)
- Painel da loja (código 2030) com:
  - Pedidos em tempo real, com som de alerta
  - **🤖 Perguntar ao JARVIS** — texto ou voz, responde sobre
    pedidos, status, faturamento (dia/semana/mês), produto mais
    pedido
  - 📊 Relatório de vendas (dia/semana/mês)
  - Botão de excluir pedido
- Acompanhamento de pedido pelo cliente (tela "Pedido enviado")
  em tempo real, com fala quando o status muda
- Proteção geral contra tela branca (`main.jsx`) — se algo der
  erro, aparece um aviso com botão de recarregar, em vez de
  sumir tudo

## Como aplicar

1. Substitui os **três** arquivos dentro de `src/` pelos deste
   pacote (confirma que ficou só um `main.jsx` na pasta).
2. Se ainda não rodou, roda no Supabase:
   - `supabase-setup.sql` (base: menu + orders)
   - `supabase-setup-jarvis.sql` (Realtime + jarvis_events)
   - `supabase-add-delete-pedidos.sql` (permissão de excluir)
3. `npm install` (se for um ambiente novo) e `npm run dev`
4. Testa: pedido completo, Área da loja, pergunta pro JARVIS,
   excluir um pedido de teste, relatório de vendas
5. Funcionando, `git add . / commit -m "..." / git push`
