import {
  Briefcase,
  Users,
  CheckSquare,
  Truck,
  Wallet,
  Landmark,
  BarChart3,
  Settings,
  FileText,
  TrendingUp
} from 'lucide-react';

export const SIDEBAR_SECTIONS = [
  {
    title: 'operation', // sidebar.operation
    items: [
      { name: 'projects', path: '/projects', icon: Briefcase, match: /^\/projects/ },
      { name: 'clients', path: '/clients', icon: Users, match: /^\/clients/ },
      { name: 'tasks', path: '/tasks', icon: CheckSquare, match: /^\/tasks/ }
    ]
  },
  {
    title: 'purchasing', // sidebar.purchasing
    items: [
      { name: 'providers', path: '/providers', icon: Truck, match: /^\/providers/ },
      { name: 'movements', path: '/movimientos', icon: Wallet, match: /^\/movimientos/ },
      { name: 'accounts', path: '/cuentas', icon: Landmark, match: /^\/cuentas/ }
    ]
  },
  {
    title: 'reports', // sidebar.reports
    items: [
      { name: 'analytics', path: '/analytics', icon: BarChart3, match: /^\/analytics/ },
      { name: 'investors', path: '/inversionistas', icon: TrendingUp, match: /^\/inversionistas/ },
      { name: 'reports', path: '/informes', icon: FileText, match: /^\/informes/ }
    ]
  },
  {
    title: 'system', // sidebar.system
    items: [
      { name: 'settings', path: '/settings', icon: Settings, match: /^\/settings/ }
    ]
  }
];