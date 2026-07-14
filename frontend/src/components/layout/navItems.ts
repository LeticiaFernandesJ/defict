import {
  Home,
  Activity,
  UtensilsCrossed,
  Scale,
  Droplet,
  Sparkles,
  Settings,
  Syringe,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** só aparece se o usuário usa Mounjaro */
  mounjaroOnly?: boolean;
  /** exibido na barra inferior (mobile) como item principal */
  primaryMobile?: boolean;
}

// Ordem fiel à referência desktop: Dashboard, Atividade, Refeições, Peso, Água, IA, Mounjaro, Configurações.
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Home, primaryMobile: true },
  { to: '/atividade', label: 'Atividade', icon: Activity, primaryMobile: true },
  { to: '/refeicoes', label: 'Refeições', icon: UtensilsCrossed, primaryMobile: true },
  { to: '/peso', label: 'Peso', icon: Scale, primaryMobile: true },
  { to: '/agua', label: 'Água', icon: Droplet },
  { to: '/ia', label: 'IA', icon: Sparkles },
  { to: '/mounjaro', label: 'Mounjaro', icon: Syringe, mounjaroOnly: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

// A barra inferior (mobile) tem ordem própria: Início, Refeições, Atividade, Peso.
export const MOBILE_PRIMARY_ORDER = ['/dashboard', '/refeicoes', '/atividade', '/peso'];
