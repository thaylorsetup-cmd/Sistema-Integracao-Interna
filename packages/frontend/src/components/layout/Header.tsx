import { useState } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';

interface HeaderProps {
  className?: string;
}

export function Header({ className = '' }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const notificationCount = 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    setShowUserMenu(false);
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    navigate('/configuracoes');
  };

  return (
    <header className={`bg-slate-950/60 backdrop-blur-xl border-b border-white/10 text-white shadow-glass relative z-20 ${className}`}>
      <div className="relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="p-2 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-xl shadow-lg shadow-benfica-blue/30 border border-white/20">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    BBT <span className="text-benfica-blue">Connect</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-benfica-blue" />
                    Sistema de Gestão
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-white/10 transition-all duration-300 hover:scale-105 hover:border-white/20"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold flex items-center justify-center bg-benfica-red text-white rounded-full shadow-lg shadow-benfica-red/40 animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown - Glassmorphism */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl z-50 text-white border border-white/10 animate-fadeIn overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-benfica-blue" />
                      Notificações
                    </h3>
                  </div>
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Nenhuma notificação</p>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 pl-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-benfica-blue to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-benfica-blue/30">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-slate-400">{user?.role || 'Operador'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown - Glassmorphism */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl z-50 text-white border border-white/10 animate-fadeIn overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <p className="font-bold text-white">{user?.name || 'Usuário'}</p>
                    <p className="text-sm text-slate-400">{user?.email || 'email@exemplo.com'}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={handleProfile}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors duration-200"
                    >
                      <User className="w-5 h-5 text-benfica-blue" />
                      <span className="font-medium text-slate-300">Perfil</span>
                    </button>
                    <button
                      onClick={handleSettings}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors duration-200"
                    >
                      <Settings className="w-5 h-5 text-benfica-blue" />
                      <span className="font-medium text-slate-300">Configurações</span>
                    </button>
                  </div>
                  <div className="border-t border-white/10 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-benfica-red/10 flex items-center gap-3 transition-colors duration-200 group"
                    >
                      <LogOut className="w-5 h-5 text-benfica-red" />
                      <span className="font-bold text-benfica-red">Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
