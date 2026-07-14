import { Link } from 'react-router-dom';
import { LegalLayout, LegalSection } from '../components/layout/LegalLayout';
import { LEGAL } from '../lib/legal';

export function Termos() {
  return (
    <LegalLayout titulo="Termos de Uso">
      <p>
        Estes Termos regulam o uso do {LEGAL.empresa}. Ao criar uma conta, você declara que
        leu e concorda com estes Termos e com a{' '}
        <Link to="/privacidade" className="font-medium text-accent">
          Política de Privacidade
        </Link>
        .
      </p>

      <LegalSection titulo="1. O serviço">
        <p>
          O {LEGAL.empresa} é um aplicativo para acompanhar alimentação, peso, hidratação e
          atividade física, com recursos de inteligência artificial. É uma ferramenta de
          registro e apoio, <b>não substitui orientação de nutricionista ou médico</b> e não
          fornece diagnóstico ou prescrição.
        </p>
      </LegalSection>

      <LegalSection titulo="2. Conta e responsabilidade">
        <p>
          Você é responsável pelas informações fornecidas e por manter a senha em sigilo. As
          atividades realizadas na sua conta são de sua responsabilidade. Avise-nos em caso
          de uso não autorizado.
        </p>
      </LegalSection>

      <LegalSection titulo="3. Planos, teste grátis e pagamento">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            O {LEGAL.empresa} oferece um período de teste gratuito de{' '}
            <b>{LEGAL.diasGratis} dias</b>.
          </li>
          <li>
            Após o período gratuito, a assinatura é de <b>{LEGAL.preco}</b>, renovada
            periodicamente até o cancelamento.
          </li>
          <li>
            Você pode <b>cancelar quando quiser</b>; o acesso permanece até o fim do período
            já contratado.
          </li>
        </ul>
      </LegalSection>

      <LegalSection titulo="4. Uso da inteligência artificial">
        <p>
          Cardápios, análises e sugestões de treino são gerados por IA e têm caráter
          informativo. O conteúdo pode conter imprecisões — use bom senso e, quando
          necessário, consulte um profissional de saúde.
        </p>
      </LegalSection>

      <LegalSection titulo="5. Uso adequado">
        <p>Você concorda em não usar o serviço para fins ilícitos, nem tentar comprometer sua segurança, integridade ou disponibilidade.</p>
      </LegalSection>

      <LegalSection titulo="6. Propriedade intelectual">
        <p>
          A marca, o design e o software do {LEGAL.empresa} pertencem aos seus titulares. Os
          dados que você registra continuam sendo seus.
        </p>
      </LegalSection>

      <LegalSection titulo="7. Cancelamento e encerramento">
        <p>
          Você pode encerrar sua conta a qualquer momento em <b>Configurações</b>. Podemos
          suspender contas que violem estes Termos.
        </p>
      </LegalSection>

      <LegalSection titulo="8. Limitação de responsabilidade">
        <p>
          O serviço é fornecido &quot;no estado em que se encontra&quot;. Na máxima extensão
          permitida por lei, não nos responsabilizamos por decisões tomadas com base nas
          informações do app, que não constituem aconselhamento médico.
        </p>
      </LegalSection>

      <LegalSection titulo="9. Alterações">
        <p>Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas no app ou por e-mail.</p>
      </LegalSection>

      <LegalSection titulo="10. Legislação e foro">
        <p>
          Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro do domicílio do
          consumidor para dirimir eventuais controvérsias.
        </p>
      </LegalSection>

      <LegalSection titulo="11. Contato">
        <p>
          Fale conosco em{' '}
          <a href={`mailto:${LEGAL.contatoPrivacidade}`} className="font-medium text-accent">
            {LEGAL.contatoPrivacidade}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
