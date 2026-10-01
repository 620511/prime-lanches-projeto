# Prime Lanches — projeto pronto para publicar

Pedidos ficam registrados no Supabase e aparecem na Área da Loja. O lojista pode abrir o WhatsApp com o pedido pronto, sem usar a API oficial do WhatsApp. O cardápio agora
fica em um banco de dados real (Supabase) — você adiciona, edita preço e
marca "esgotado" pela própria tela do site ("Área da loja", código `1234`),
sem editar código.

## 1. Crie o banco de dados no Supabase (grátis)

1. Crie uma conta em [supabase.com](https://supabase.com) (dá pra entrar
   com GitHub).
2. Clique em **"New project"**, dê um nome (ex: `prime-lanches`) e uma
   senha para o banco (guarde essa senha, mas não vai precisar dela aqui).
3. Espere o projeto terminar de criar (1–2 minutos).
4. No menu lateral, vá em **SQL Editor** → **New query**.
5. Abra o arquivo `supabase-setup.sql` desta pasta, copie todo o conteúdo,
   cole no editor e clique em **Run**. Isso cria a tabela do cardápio já
   com os produtos que estavam no site.
6. No menu lateral, vá em **Project Settings → API**. Você vai precisar de
   duas informações dessa tela:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (uma chave longa)

## 2. Configure essas duas informações no Vercel

No painel do seu projeto no Vercel: **Settings → Environment Variables**.
Adicione duas variáveis (Chave/Valor), marcando "Production" e "Preview":

| Chave                     | Valor                                  |
|---------------------------|-----------------------------------------|
| `VITE_SUPABASE_URL`       | a Project URL que você copiou           |
| `VITE_SUPABASE_ANON_KEY`  | a anon public key que você copiou       |

Depois de adicionar, vá em **Deployments**, nos três pontinhos do último
deploy clique em **Redeploy** (as variáveis só valem a partir do próximo
deploy).

## 3. Testar localmente (opcional)

Copie `.env.example` para um arquivo `.env` e preencha com os mesmos
valores do passo 1. Depois:
```
npm install
npm run dev
```
Abre em http://localhost:5173

## Como usar no dia a dia

- **Ver pedidos**: entre em "Área da loja". Os pedidos aparecem automaticamente e são atualizados a cada 8 segundos.
- **WhatsApp**: no pedido, o lojista clica em "Abrir WhatsApp com o pedido". O WhatsApp abre com a mensagem pronta; o lojista é quem decide enviar.
- **Adicionar/editar/remover produto**: no site publicado, role até o
  rodapé → **"Área da loja"** → código `1234` → formulário completo.
  As mudanças aparecem para os clientes em poucos segundos.

## Publicar no Vercel (se ainda não fez)

1. Crie um repositório no GitHub e suba esta pasta (`git init`, `git add .`,
   `git commit -m "Prime Lanches"`, `git push`).
2. Em [vercel.com](https://vercel.com), "Add New" → "Project" → escolha o
   repositório → configure as variáveis de ambiente (passo 2 acima) →
   **Deploy**.


## 4. Ativar os pedidos no Supabase

Depois de configurar as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, rode o arquivo `src/supabase-setup.sql` inteiro no SQL Editor do Supabase.

Isso cria a tabela `orders`.

### Fluxo novo

Cliente → confirma pedido → pedido é salvo no Supabase → lojista vê no painel → lojista pode abrir o WhatsApp com a mensagem pronta.

O cliente não precisa abrir o WhatsApp e não consegue alterar o pedido pelo WhatsApp, porque o pedido oficial fica registrado no banco.
