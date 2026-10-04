# Relatório de vendas completo — dia/semana/mês/ano + consulta de período

## O que mudou

1. **Apareceu o cartão "Este ano"** ao lado de Hoje/Esta semana/Este mês.

2. **Nova seção "🔎 Consultar outro período"**, logo abaixo dos
   cartões, no mesmo quadro de relatório. Você escolhe:
   - **Dia** — um calendário pra escolher a data exata
   - **Mês** — escolhe mês e ano
   - **Ano** — digita o ano (ex: 2025, 2024...)

   Clica em "Consultar" e aparece: faturamento, quantidade de
   pedidos e ticket médio **daquele período específico** — inclusive
   de meses/anos passados, não só do período atual.

3. **O JARVIS também entende isso por voz/texto agora**: pergunta
   "quanto vendeu esse ano" ou "faturamento anual" que ele responde.
   (A consulta de uma data específica passada, tipo "quanto vendi em
   março", ainda não dá pra perguntar por voz — isso é feito pelos
   seletores de Dia/Mês/Ano no relatório mesmo.)

## Por que criei uma busca separada pra isso

O relatório do dia a dia (cartões de cima) só carrega dados do ano
atual pra não pesar o site toda hora. Já a consulta de período busca
direto no banco, sob demanda, então funciona pra qualquer data, mesmo
de anos anteriores — sem deixar o carregamento do painel mais lento
no dia a dia.

## Como aplicar

1. Substitui `src/App.jsx` e `src/menuApi.js` pelos deste pacote
   (o `main.jsx` da proteção contra tela branca continua o mesmo,
   não precisa trocar de novo).
2. `npm run dev`, entra na Área da loja, testa o relatório e a
   consulta por período.
3. Funcionando, `git add . / commit / push`.
