# Déficit

PWA de controle calórico e acompanhamento de emagrecimento com foco em déficit calórico.
Stack **100% TypeScript**, arquitetura **Supabase-centric** (Postgres + Auth + RLS + Edge Functions).

## Estrutura

```
frontend/            App React 19 + Vite + TS + Tailwind (PWA)
supabase/
  migrations/        Schema Postgres (0001) + RLS (0002)
  functions/gemini/  Edge Function (Deno) — proxy autenticado para o Google Gemini
```

Não há backend NestJS: o CRUD vai direto pelo `@supabase/supabase-js` respeitando RLS;
as operações sensíveis (Gemini) passam pela Edge Function server-side.

## Setup

### 1. Supabase
1. Crie um projeto em [supabase.com](https://supabase.com).
2. Aplique as migrations (SQL Editor ou CLI):
   ```bash
   supabase link --project-ref <ref>
   supabase db push          # aplica supabase/migrations/*
   ```
3. Deploy das Edge Functions e secrets:
   ```bash
   supabase functions deploy gemini
   supabase functions deploy treino                          # treino por IA (Claude)
   supabase functions deploy notificacoes-dispatch --no-verify-jwt

   supabase secrets set GEMINI_API_KEY=<sua-chave>
   supabase secrets set ANTHROPIC_API_KEY=<chave-claude>     # treino; modelo padrão claude-sonnet-5
   # Web Push (gere um par VAPID, ex.: npx web-push generate-vapid-keys):
   supabase secrets set VAPID_PUBLIC_KEY=<pub> VAPID_PRIVATE_KEY=<priv> VAPID_SUBJECT=mailto:voce@exemplo.com
   ```
4. Notificações agendadas: habilite as extensões **pg_cron** e **pg_net** (Dashboard → Database → Extensions) e rode `supabase/migrations/0005_cron_notificacoes.sql` (ajuste a URL do projeto se necessário).

### 2. Frontend
```bash
cd frontend
cp .env.example .env        # VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_VAPID_PUBLIC_KEY
npm install
npm run dev                 # http://localhost:5173
```

## Segurança (regras rígidas)
- Só `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` podem existir no frontend.
- `SERVICE_ROLE`, `SECRET_KEY`, `DATABASE_URL`, `GEMINI_API_KEY` ficam **só** no servidor/Edge Functions.
- **Toda** tabela com dados de usuário tem RLS ativa (`auth.uid() = usuario_id`).
- Se uma chave secreta vazar, rotacione em Settings → API.

## Status da implementação (vertical slice)
Pronto e executável ponta a ponta:
- Design system (tokens, tipografia, componentes UI, animações).
- Auth (login/cadastro via Supabase Auth) + trigger que cria `profiles`.
- Onboarding (coleta perfil, marca `onboarding_concluido`, grava peso inicial).
- Dashboard (resumo do dia: calorias vs meta, macros, água, peso, IMC/TDEE/meta, gráfico 7 dias).
- Shell responsivo (sidebar desktop + bottom nav/sheet mobile), guards de rota.
- Landing page pública (`/`) com SEO básico.
- Schema + RLS completos para todos os módulos; Edge Function do Gemini.

Módulos em `EmBreve` (fundação pronta, UI a plugar): Refeições, Atividade, Água, Peso,
IA, Configurações, Notificações, Mounjaro.

## Regras de negócio (calc)
Ver `frontend/src/lib/calc.ts`. **Peculiaridade preservada do original**: o valor
retornado como "TMB" já é `TMB × fator de atividade` e o `TDEE` é retornado igual a ele;
`tmbPura` fica exposta à parte. Meta = `max(1200, tdee − 500)`; meta manual sobrepõe.
