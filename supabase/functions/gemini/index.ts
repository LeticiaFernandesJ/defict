// Edge Function (Deno) — proxy autenticado para o Google Gemini.
// A chave GEMINI_API_KEY vive APENAS aqui (supabase secrets); nunca vai ao browser.
// O cliente chama esta função com o JWT do usuário; validamos antes de repassar.
//
// Deploy:  supabase functions deploy gemini
// Secret:  supabase secrets set GEMINI_API_KEY=...
//
// Ações (body.action): 'chat' | 'analisar-dia' | 'cardapio' | 'nutrientes'

import { usuarioDoRequest } from '../_shared/auth.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

// Modelo principal + fallbacks (usados em ordem quando o principal está sobrecarregado).
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

async function gerar(prompt: string, maxTokens = 2048): Promise<string> {
  let ultimoErro: { code?: number; message?: string } | null = null;
  for (const m of MODELOS) {
    const res = await fetch(`${endpoint(m)}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens,
          thinkingConfig: { thinkingBudget: 0 }, // sem "pensamento" — economiza cota e evita corte
        },
      }),
    });
    const data = await res.json();
    if (data?.error) {
      ultimoErro = data.error;
      continue; // sobrecarga/cota nesse modelo → tenta o próximo
    }
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (texto) return texto;
    ultimoErro = { message: 'resposta vazia' };
  }
  if (ultimoErro?.code === 429)
    throw new Error('Limite da IA (Gemini) excedido no momento. Tente mais tarde ou ative o billing no Google AI Studio.');
  throw new Error(ultimoErro?.message || 'A IA está sobrecarregada. Tente novamente em instantes.');
}

/** Remove cercas de código e extrai o primeiro objeto JSON (do 1º { ao último }). */
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

const ZERO_NUTRIENTES = {
  calorias: 0,
  proteinas: 0,
  carboidratos: 0,
  gorduras: 0,
  fibras: 0,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // --- valida o JWT próprio (assinado com JWT_SECRET) ---
  const uid = await usuarioDoRequest(req);
  if (!uid) return json({ error: 'Não autenticado' }, 401);

  const { action, ...payload } = await req.json();

  try {
    switch (action) {
      case 'chat': {
        const { mensagem, contexto } = payload;
        const prompt = `Você é um assistente nutricional em português do Brasil.
${contexto ? `Contexto: ${contexto}\n` : ''}Usuário: ${mensagem}`;
        return json({ resposta: await gerar(prompt) });
      }

      case 'analisar-dia': {
        const { resumo } = payload;
        const prompt = `Analise de forma curta e motivadora (máximo 4 linhas), em português,
a alimentação do dia a seguir. Seja positivo e prático.
Dados: ${JSON.stringify(resumo)}`;
        return json({ analise: await gerar(prompt) });
      }

      case 'cardapio': {
        const { preferencias, restricoes, metaCalorica, refeicoes } = payload;
        const listaRef =
          Array.isArray(refeicoes) && refeicoes.length
            ? (refeicoes as string[]).join(', ')
            : 'Café da manhã, Almoço, Jantar';
        const prompt = `Gere um cardápio semanal em JSON VÁLIDO PURO (sem markdown, sem texto extra, sem comentários).
Preferências: ${preferencias ?? '—'}. Restrições: ${restricoes ?? '—'}.
Meta calórica diária: ${metaCalorica ?? 2000} kcal.
As refeições de CADA dia devem ser EXATAMENTE estas, nessa ordem: ${listaRef}. Use esses nomes no campo "tipo".
IMPORTANTE para caber na resposta: exatamente 7 dias; no máximo 2 itens por refeição; descrições e nomes curtos.
SEMPRE feche todas as chaves e colchetes.
Estrutura: { "dias": [ { "nomeDia", "diaSemanaIndex", "refeicoes": [ { "tipo", "descricao",
"itens": [ { "nomeAlimento","quantidade","unidade","calorias","proteinas","carboidratos","gorduras","fibras" } ] } ] } ] }`;
        const valido = (c: Record<string, unknown> | null) =>
          !!c && Array.isArray((c as { dias?: unknown[] }).dias) && (c as { dias: unknown[] }).dias.length > 0;
        let cardapio = extrairJson(await gerar(prompt, 8192));
        if (!valido(cardapio)) cardapio = extrairJson(await gerar(prompt, 8192)); // 1 nova tentativa
        return json({ cardapio });
      }

      case 'nutrientes': {
        const { alimento, quantidade, unidade } = payload;
        const prompt = `Você é nutricionista. Para "${alimento}" (${quantidade} ${unidade}),
retorne APENAS este JSON (decimais com 1 casa; 0 se desconhecido), sem texto extra:
{"calorias":0,"proteinas":0,"carboidratos":0,"gorduras":0,"fibras":0}`;
        const parsed = extrairJson(await gerar(prompt));
        return json({ nutrientes: parsed ?? ZERO_NUTRIENTES });
      }

      default:
        return json({ error: 'Ação inválida' }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
