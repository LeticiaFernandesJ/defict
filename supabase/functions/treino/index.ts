// Edge Function (Deno) — proxy autenticado para o Google Gemini.
// Gera um plano de treino semanal em JSON. A chave GEMINI_API_KEY vive
// APENAS aqui (supabase secrets); nunca vai ao browser.
//
// Deploy:  supabase functions deploy treino --no-verify-jwt
// Secret:  supabase secrets set GEMINI_API_KEY=...  (mesma chave da função gemini)

import { usuarioDoRequest } from '../_shared/auth.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
const MODELOS = [MODEL, 'gemini-flash-lite-latest', 'gemini-2.0-flash'].filter(
  (m, i, a) => a.indexOf(m) === i,
);
const endpoint = (m: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/** Remove cercas de código e extrai o primeiro objeto JSON (1º { ao último }). */
function extrairJson(texto: string): Record<string, unknown> | null {
  const limpo = texto.replace(/```json/gi, '').replace(/```/g, '').trim();
  const ini = limpo.indexOf('{');
  const fim = limpo.lastIndexOf('}');
  if (ini === -1 || fim === -1 || fim < ini) return null;
  try {
    return JSON.parse(limpo.slice(ini, fim + 1));
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // valida o JWT próprio (assinado com JWT_SECRET)
  const uid = await usuarioDoRequest(req);
  if (!uid) return json({ error: 'Não autenticado' }, 401);

  const { objetivo, dias, equipamento, restricoes, nivelAtividade } = await req.json();
  const listaDias =
    Array.isArray(dias) && dias.length ? dias.join(', ') : 'Segunda, Quarta, Sexta';

  const prompt = `Você é um educador físico. Gere um plano de treino em JSON VÁLIDO PURO
(sem markdown, sem texto extra) para os dias da semana: ${listaDias}.
objetivo="${objetivo}", equipamento="${equipamento}", restrições="${restricoes ?? '—'}", nível="${nivelAtividade ?? 'Sedentario'}".
Estrutura exata: { "dias": [ { "diaSemana": "", "titulo": "", "foco": "",
"exercicios": [ { "nome":"", "series":0, "repeticoes":"", "descanso":"", "observacao":"" } ] } ] }
Gere UM objeto para CADA dia listado, usando EXATAMENTE esses nomes de dia em "diaSemana", na ordem dada.
Responda em português do Brasil.`;

  try {
    let ultimoErro: { code?: number; message?: string } | null = null;
    for (const m of MODELOS) {
      const res = await fetch(`${endpoint(m)}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3072,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });
      const data = await res.json();
      if (data?.error) {
        ultimoErro = data.error; // sobrecarga/cota → tenta o próximo modelo
        continue;
      }
      const texto: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const plano = extrairJson(texto);
      if (plano) return json({ plano });
      ultimoErro = { message: 'resposta vazia' };
    }
    const msg =
      ultimoErro?.code === 429
        ? 'Limite da IA (Gemini) excedido no momento. Tente mais tarde ou ative o billing no Google AI Studio.'
        : ultimoErro?.message || 'A IA está sobrecarregada. Tente novamente em instantes.';
    return json({ error: msg }, 502);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
