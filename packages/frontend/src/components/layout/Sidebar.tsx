import { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Tv,
  FileText,
  Settings,
  Menu,
  X,
  FileSearch,
  Ticket,
  RotateCcw,
} from 'lucide-react';
import type { Permission } from '@/types';
import { useAuth } from '@/contexts';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  permission?: keyof Permission;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    to: '/dashboard/operador',
    icon: LayoutDashboard,
    label: 'Envio de Documentos',
    permission: 'viewDashboardOperador',
  },
  {
    to: '/dashboard/minhas-corridas',
    icon: RotateCcw,
    label: 'Minhas Corridas',
    permission: 'viewDashboardOperador',
  },
  {
    to: '/dashboard/cadastro-gr',
    icon: FileSearch,
    label: 'Cadastro GR',
    badge: 'NOVO',
    permission: 'viewDashboardCadastroGR',
  },
  {
    to: '/dashboard/gestao',
    icon: BarChart3,
    label: 'Dashboard Gestão',
    permission: 'viewDashboardGestao',
  },
  {
    to: '/tv-display',
    icon: Tv,
    label: 'TV Display',
    badge: 'LIVE',
    adminOnly: true,
  },
  {
    to: '/auditoria',
    icon: FileText,
    label: 'Auditoria',
    permission: 'viewAuditoria',
  },
  {
    to: '/tickets',
    icon: Ticket,
    label: 'Tickets',
    adminOnly: true,
  },
  {
    to: '/configuracoes',
    icon: Settings,
    label: 'Configurações',
  },
];

export function Sidebar({ className = '' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { hasPermission, user } = useAuth();

  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.adminOnly) return user?.role === 'admin';
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  }, [hasPermission, user]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-benfica-red to-red-700 text-white rounded-2xl shadow-2xl shadow-benfica-red/40 hover:shadow-benfica-red/60 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Glassmorphism Dark Design */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-72 h-full bg-slate-950/60 backdrop-blur-xl
          border-r border-white/10
          shadow-glass
          transform transition-all duration-300 ease-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
      >
        {/* Navigation starts directly - logo is in Header */}
        <nav className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
          {/* Navigation Items */}
          <div className="flex-1 px-4 space-y-2">
            {filteredNavItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3 px-4 py-3.5 rounded-xl
                    transition-all duration-300 group relative
                    animate-slideIn
                    ${isActive
                    ? 'bg-benfica-blue/20 text-white border border-benfica-blue/30 shadow-lg shadow-benfica-blue/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Glow effect for active item */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-benfica-blue rounded-r-full shadow-lg shadow-benfica-blue/50"></div>
                    )}
                    <item.icon
                      className={`
                        relative w-5 h-5 transition-all duration-300
                        ${isActive ? 'text-benfica-blue' : 'text-slate-500 group-hover:text-benfica-blue'}
                        ${!isActive && 'group-hover:scale-110'}
                      `}
                    />
                    <span className="relative font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className={`
                        relative ml-auto text-xs font-bold px-2 py-0.5 rounded-full
                        ${isActive
                          ? 'bg-benfica-blue/30 text-benfica-blue'
                          : 'bg-benfica-red text-white animate-pulse'
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Footer - Version info */}
          <div className="px-4 pt-4 mt-auto">
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-text-secondary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>BBT Connect • v1.0.0</span>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
