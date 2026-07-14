// Edge Function (Deno) — Autenticação PRÓPRIA do Déficit.
// Emite um JWT (HS256) assinado com o JWT secret do projeto, com sub = usuarios.id
// e role/aud = 'authenticated' — assim a RLS do Postgres (auth.uid()) aceita o token
// e o frontend continua usando supabase-js normalmente (opção accessToken).
//
// Deploy:  supabase functions deploy auth --no-verify-jwt
// Secret:  supabase secrets set JWT_SECRET=<JWT Secret do projeto: Settings → API → JWT Settings>
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente das funções.)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET')!;
const EXPIRA_DIAS = 7;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

let cryptoKey: CryptoKey | null = null;
async function getKey(): Promise<CryptoKey> {
  if (!cryptoKey) {
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
  }
  return cryptoKey;
}

async function emitirToken(id: string, email: string): Promise<string> {
  const key = await getKey();
  return await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      sub: id,
      email,
      role: 'authenticated',
      aud: 'authenticated',
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 60 * 24 * EXPIRA_DIAS),
    },
    key,
  );
}

async function usuarioDoToken(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const key = await getKey();
    const payload = await verify(token, key);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
function senhaInvalida(s: string): string | null {
  if (s.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
  if (!/[A-Z]/.test(s)) return 'A senha deve conter pelo menos uma letra maiúscula.';
  if (!/[0-9]/.test(s)) return 'A senha deve conter pelo menos um número.';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  try {
    switch (action) {
      // ---------------------------------------------------- cadastro
      case 'register': {
        const email = String(body.email ?? '').trim().toLowerCase();
        const senha = String(body.senha ?? '');
        if (!emailValido(email)) return json({ error: 'Email inválido.' }, 400);
        const errSenha = senhaInvalida(senha);
        if (errSenha) return json({ error: errSenha }, 400);

        const { data: existe } = await admin.from('usuarios').select('id').eq('email', email).maybeSingle();
        if (existe) return json({ error: 'Email já cadastrado.' }, 409);

        const senha_hash = bcrypt.hashSync(senha, 10);
        const { data: u, error: eu } = await admin
          .from('usuarios')
          .insert({ email, senha_hash })
          .select('id, email')
          .single();
        if (eu || !u) return json({ error: eu?.message ?? 'Falha ao criar usuário.' }, 500);

        const { data: profile, error: ep } = await admin
          .from('profiles')
          .insert({
            id: u.id,
            nome: body.nome ?? '',
            sexo: body.sexo ?? null,
            data_nascimento: body.dataNascimento ?? null,
            altura: body.altura ?? null,
            nivel_atividade: body.nivelAtividade ?? null,
            peso_inicial: body.pesoInicial ?? null,
            peso_meta: body.pesoMeta ?? null,
            meta_agua: body.metaAgua ?? 2000,
            usa_mounjaro: body.usaMounjaro ?? false,
            meta_calorica_manual: body.metaCaloricaManual ?? null,
            onboarding_concluido: true,
          })
          .select('*')
          .single();
        if (ep) return json({ error: ep.message }, 500);

        const token = await emitirToken(u.id, u.email);
        return json({ token, user: { id: u.id, email: u.email }, profile });
      }

      // ---------------------------------------------------- login
      case 'login': {
        const email = String(body.email ?? '').trim().toLowerCase();
        const senha = String(body.senha ?? '');
        const { data: u } = await admin
          .from('usuarios')
          .select('id, email, senha_hash')
          .eq('email', email)
          .maybeSingle();
        if (!u || !bcrypt.compareSync(senha, u.senha_hash))
          return json({ error: 'E-mail ou senha incorretos.' }, 401);
        const token = await emitirToken(u.id, u.email);
        return json({ token, user: { id: u.id, email: u.email } });
      }

      // ---------------------------------------------------- trocar senha
      case 'change-password': {
        const id = await usuarioDoToken(req);
        if (!id) return json({ error: 'Não autenticado' }, 401);
        const errSenha = senhaInvalida(String(body.senha ?? ''));
        if (errSenha) return json({ error: errSenha }, 400);
        const senha_hash = bcrypt.hashSync(String(body.senha), 10);
        const { error } = await admin.from('usuarios').update({ senha_hash }).eq('id', id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      // ---------------------------------------------------- trocar e-mail
      case 'change-email': {
        const id = await usuarioDoToken(req);
        if (!id) return json({ error: 'Não autenticado' }, 401);
        const email = String(body.email ?? '').trim().toLowerCase();
        if (!emailValido(email)) return json({ error: 'Email inválido.' }, 400);
        const { data: existe } = await admin.from('usuarios').select('id').eq('email', email).neq('id', id).maybeSingle();
        if (existe) return json({ error: 'Email já cadastrado.' }, 409);
        const { error } = await admin.from('usuarios').update({ email }).eq('id', id);
        if (error) return json({ error: error.message }, 500);
        const token = await emitirToken(id, email); // novo token com o e-mail atualizado
        return json({ ok: true, token, user: { id, email } });
      }

      // ---------------------------------------------------- excluir conta
      case 'delete': {
        const id = await usuarioDoToken(req);
        if (!id) return json({ error: 'Não autenticado' }, 401);
        const { error } = await admin.from('usuarios').delete().eq('id', id); // cascade → profiles + dados
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      default:
        return json({ error: 'Ação inválida' }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
