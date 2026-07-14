import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { hojeISO } from '../lib/dates';
import type { ItemRefeicao, RegistroAgua, RegistroPeso } from '../types';

export interface ResumoDia {
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number;
  quantidadeRefeicoes: number;
}

export interface DashboardData {
  resumo: ResumoDia;
  agua: RegistroAgua | null;
  pesoAtual: number | null;
  serie7dias: { dia: string; calorias: number }[];
}

const zerado: ResumoDia = {
  calorias: 0,
  proteinas: 0,
  carboidratos: 0,
  gorduras: 0,
  fibras: 0,
  quantidadeRefeicoes: 0,
};

export function useDashboard(userId: string | undefined) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', userId, hojeISO()],
    enabled: !!userId,
    queryFn: async () => {
      const hoje = hojeISO();
      const inicioHoje = `${hoje}T00:00:00`;
      const fimHoje = `${hoje}T23:59:59`;

      // Refeições de hoje + itens (macros).
      const { data: refeicoes, error: errRef } = await supabase
        .from('refeicoes')
        .select('id, data, itens:itens_refeicao(*)')
        .gte('data', inicioHoje)
        .lte('data', fimHoje);
      if (errRef) throw errRef;

      const resumo = { ...zerado };
      resumo.quantidadeRefeicoes = refeicoes?.length ?? 0;
      for (const r of refeicoes ?? []) {
        for (const it of (r.itens ?? []) as ItemRefeicao[]) {
          resumo.calorias += Number(it.calorias) || 0;
          resumo.proteinas += Number(it.proteinas) || 0;
          resumo.carboidratos += Number(it.carboidratos) || 0;
          resumo.gorduras += Number(it.gorduras) || 0;
          resumo.fibras += Number(it.fibras) || 0;
        }
      }

      // Água de hoje.
      const { data: agua } = await supabase
        .from('registros_agua')
        .select('*')
        .eq('data', hoje)
        .maybeSingle();

      // Peso mais recente.
      const { data: peso } = await supabase
        .from('registros_peso')
        .select('*')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Série dos últimos 7 dias (calorias/dia).
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
      const { data: refs7 } = await supabase
        .from('refeicoes')
        .select('data, itens:itens_refeicao(calorias)')
        .gte('data', seteDiasAtras.toISOString());

      const mapa = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        mapa.set(d.toISOString().slice(0, 10), 0);
      }
      for (const r of refs7 ?? []) {
        const dia = String(r.data).slice(0, 10);
        if (!mapa.has(dia)) continue;
        const soma = ((r.itens ?? []) as { calorias: number }[]).reduce(
          (acc, it) => acc + (Number(it.calorias) || 0),
          0,
        );
        mapa.set(dia, (mapa.get(dia) ?? 0) + soma);
      }
      const serie7dias = [...mapa.entries()].map(([dia, calorias]) => ({
        dia: dia.slice(8, 10) + '/' + dia.slice(5, 7),
        calorias: Math.round(calorias),
      }));

      return {
        resumo,
        agua: (agua as RegistroAgua) ?? null,
        pesoAtual: peso ? Number((peso as RegistroPeso).peso) : null,
        serie7dias,
      };
    },
  });
}
