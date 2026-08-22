# Prime Lanches — projeto pronto para publicar

Pedidos vão direto para o WhatsApp da loja (85999168937). O cardápio agora
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

- **Ver pedidos**: chegam direto no WhatsApp da loja, como mensagem normal.
- **Adicionar/editar/remover produto**: no site publicado, role até o
  rodapé → **"Área da loja"** → código `1234` → formulário completo.
  As mudanças aparecem para os clientes em poucos segundos.

## Publicar no Vercel (se ainda não fez)

1. Crie um repositório no GitHub e suba esta pasta (`git init`, `git add .`,
   `git commit -m "Prime Lanches"`, `git push`).
2. Em [vercel.com](https://vercel.com), "Add New" → "Project" → escolha o
   repositório → configure as variáveis de ambiente (passo 2 acima) →
   **Deploy**.
