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
    title: 'Operacion', // Translation key: sidebar.operacion
    items: [
      { 
        name: 'Proyectos', 
        path: '/projects',
        icon: Briefcase,
        match: /^\/projects/ 
      },
      { 
        name: 'Clientes', 
        path: '/clients', 
        icon: Users,
        match: /^\/clients/
      },
      { 
        name: 'Tareas', 
        path: '/tasks', 
        icon: CheckSquare,
        match: /^\/tasks/
      }
    ]
  },
  {
    title: 'Compras', // Translation key: sidebar.compras
    items: [
      { 
        name: 'Proveedores', 
        path: '/providers', 
        icon: Truck,
        match: /^\/providers/
      },
      { 
        name: 'Movimientos', 
        path: '/movimientos', 
        icon: Wallet,
        match: /^\/movimientos/
      },
      { 
        name: 'Cuentas', 
        path: '/cuentas', 
        icon: Landmark,
        match: /^\/cuentas/
      }
    ]
  },
  {
    title: 'reportes', // Translation key: sidebar.reportes
    items: [
      { 
        name: 'Analítica', 
        path: '/analytics', 
        icon: BarChart3,
        match: /^\/analytics/
      },
      { 
        name: 'Inversionistas', 
        path: '/inversionistas', 
        icon: TrendingUp,
        match: /^\/inversionistas/
      },
      {
        name: 'Informes',
        path: '/informes',
        icon: FileText,
        match: /^\/informes/
      }
    ]
  },
  {
    title: 'sistema', // Translation key: sidebar.sistema
    items: [
      { 
        name: 'Configuración', 
        path: '/settings', 
        icon: Settings,
        match: /^\/settings/
      }
    ]
  }
];