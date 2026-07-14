import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { LegalLayout, LegalSection } from '../components/layout/LegalLayout';
import { LEGAL } from '../lib/legal';

export function Privacidade() {
  return (
    <LegalLayout titulo="Política de Privacidade">
      <p>
        O {LEGAL.empresa} respeita a sua privacidade e trata seus dados pessoais em
        conformidade com a <b>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)</b>.
        Esta política explica quais dados coletamos, por que os usamos, com quem os
        compartilhamos e como você pode exercer seus direitos.
      </p>

      <div className="flex items-start gap-3 rounded-card bg-accent/10 p-4 text-sm">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-accent" />
        <p>
          O {LEGAL.empresa} é uma ferramenta de registro e acompanhamento. Ele{' '}
          <b>não substitui orientação de nutricionista ou médico</b> e não realiza
          diagnósticos.
        </p>
      </div>

      <LegalSection titulo="1. Quem é o controlador dos dados">
        <p>
          O controlador é o {LEGAL.empresa}, responsável pelas decisões sobre o tratamento
          dos seus dados. Para questões de privacidade e para falar com o Encarregado (DPO),
          use o e-mail{' '}
          <a href={`mailto:${LEGAL.contatoPrivacidade}`} className="font-medium text-accent">
            {LEGAL.contatoPrivacidade}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection titulo="2. Quais dados coletamos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b>Dados cadastrais:</b> nome e e-mail. A senha é armazenada de forma cifrada
            (hash) — nunca temos acesso a ela em texto puro.
          </li>
          <li>
            <b>Dados de perfil:</b> sexo, data de nascimento e altura.
          </li>
          <li>
            <b>Dados sensíveis de saúde</b> (art. 5º, II, da LGPD): peso e evolução,
            refeições e nutrientes, hidratação, atividade física e — caso você utilize o
            módulo opcional — registros de uso de Mounjaro (dose, local de aplicação e
            sintomas).
          </li>
          <li>
            <b>Dados de uso:</b> informações técnicas necessárias ao funcionamento e à
            segurança do serviço.
          </li>
        </ul>
      </LegalSection>

      <LegalSection titulo="3. Base legal e consentimento">
        <p>
          Tratamos seus dados com base no seu <b>consentimento</b> (art. 7º, I, da LGPD) e,
          para os dados sensíveis de saúde, no <b>consentimento específico e destacado</b>{' '}
          (art. 11, I). Esse consentimento é coletado no momento do cadastro e pode ser
          <b> revogado a qualquer momento</b>, com a exclusão da conta e dos dados.
        </p>
      </LegalSection>

      <LegalSection titulo="4. Para que usamos seus dados">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Calcular sua meta calórica (IMC, TMB e TDEE) e acompanhar o progresso.</li>
          <li>Gerar cardápios, análises e sugestões de treino com inteligência artificial.</li>
          <li>Registrar refeições, peso, água e atividade em um só lugar.</li>
          <li>Enviar lembretes e notificações que você configurar.</li>
        </ul>
      </LegalSection>

      <LegalSection titulo="5. Com quem compartilhamos">
        <p>Não vendemos seus dados. Compartilhamos o mínimo necessário com operadores que viabilizam o serviço:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <b>Supabase</b> — hospedagem do banco de dados e autenticação.
          </li>
          <li>
            <b>Google (Gemini)</b> — quando você usa os recursos de IA (cardápio, análise do
            dia e chat), o texto necessário é enviado ao serviço para gerar a resposta.
          </li>
        </ul>
        <p className="mt-2">
          Esses provedores podem processar dados <b>fora do Brasil</b>. A transferência
          internacional segue o art. 33 da LGPD, com salvaguardas contratuais e técnicas.
        </p>
      </LegalSection>

      <LegalSection titulo="6. Segurança">
        <p>
          Adotamos medidas técnicas para proteger seus dados: senhas com hash, tráfego
          cifrado (HTTPS) e <b>isolamento por usuário</b> no banco de dados — cada pessoa
          acessa apenas os próprios registros. Nenhum sistema é 100% imune, mas trabalhamos
          para reduzir riscos.
        </p>
      </LegalSection>

      <LegalSection titulo="7. Por quanto tempo guardamos">
        <p>
          Mantemos seus dados enquanto sua conta existir. Ao excluir a conta, seus dados
          pessoais são eliminados, salvo obrigações legais de retenção.
        </p>
      </LegalSection>

      <LegalSection titulo="8. Seus direitos como titular (art. 18)">
        <p>Você pode, a qualquer momento:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Confirmar a existência de tratamento e acessar seus dados;</li>
          <li>Corrigir dados incompletos ou desatualizados;</li>
          <li>Solicitar a portabilidade;</li>
          <li>Eliminar seus dados e revogar o consentimento;</li>
          <li>Obter informação sobre com quem compartilhamos.</li>
        </ul>
        <p className="mt-2">
          Você exerce boa parte desses direitos direto no app, em{' '}
          <b>Configurações</b> (editar perfil e excluir conta). Para os demais, escreva para{' '}
          <a href={`mailto:${LEGAL.contatoPrivacidade}`} className="font-medium text-accent">
            {LEGAL.contatoPrivacidade}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection titulo="9. Cookies e armazenamento local">
        <p>
          Usamos apenas armazenamento <b>essencial</b> no seu dispositivo (por exemplo, o
          token que mantém você conectado). <b>Não</b> utilizamos cookies de publicidade nem
          rastreadores de terceiros.
        </p>
      </LegalSection>

      <LegalSection titulo="10. Crianças e adolescentes">
        <p>
          O serviço é destinado a maiores de 18 anos. Menores só devem usá-lo com o
          consentimento e a supervisão dos responsáveis legais.
        </p>
      </LegalSection>

      <LegalSection titulo="11. Alterações nesta política">
        <p>
          Podemos atualizar esta política. Mudanças relevantes serão informadas no app ou
          por e-mail. A data no topo indica a última revisão.
        </p>
      </LegalSection>

      <LegalSection titulo="12. Contato">
        <p>
          Dúvidas sobre privacidade? Fale com o Encarregado pelo Tratamento de Dados em{' '}
          <a href={`mailto:${LEGAL.contatoPrivacidade}`} className="font-medium text-accent">
            {LEGAL.contatoPrivacidade}
          </a>
          . Consulte também nossos{' '}
          <Link to="/termos" className="font-medium text-accent">
            Termos de Uso
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
