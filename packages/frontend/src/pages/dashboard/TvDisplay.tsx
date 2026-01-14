import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoBackground } from '@/components/ui';
import {
  Map,
  BarChart3,
  FileText,
  AlertTriangle,
  Tv,
  Play,
  Clock,
  Maximize2,
  ExternalLink,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface TvDisplayOption {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

const tvDisplayOptions: TvDisplayOption[] = [
  {
    id: 1,
    title: 'Mapa de Monitoramento',
    description: 'Visualização em tempo real da frota com rotas ativas e posição dos veículos',
    icon: Map,
    route: '/tv/mapa',
    color: 'emerald',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
  },
  {
    id: 2,
    title: 'KPIs Operacionais',
    description: 'Métricas e indicadores de performance em tempo real',
    icon: BarChart3,
    route: '/tv/kpis',
    color: 'blue',
    gradientFrom: 'from-benfica-blue',
    gradientTo: 'to-blue-600',
  },
  {
    id: 3,
    title: 'Cadastros GR',
    description: 'Status de cadastros de Gerenciamento de Riscos pendentes e aprovados',
    icon: FileText,
    route: '/tv/cadastros',
    color: 'purple',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-600',
  },
  {
    id: 4,
    title: 'Central de Alertas',
    description: 'Alertas e notificações importantes do sistema',
    icon: AlertTriangle,
    route: '/tv/alertas',
    color: 'amber',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
  },
];

export function TvDisplay() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useState(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  });

  const handleOpenDisplay = (route: string, newTab: boolean = false) => {
    if (newTab) {
      window.open(route, '_blank');
    } else {
      navigate(route);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white font-sans">
      {/* Video Background */}
      <VideoBackground
        videoSrc="/bbt-background-optimized.webm"
        fallbackToAnimated={true}
      />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-3xl rounded-2xl p-5 border border-white/10 mb-6">
          <div className="flex items-center gap-4">
            {/* Botão Voltar */}
            <button
              onClick={() => navigate('/')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="relative">
              <div className="absolute -inset-1 bg-benfica-blue/30 rounded-xl blur opacity-60"></div>
              <img
                src="/bbt-connect-logo.png"
                alt="BBT Connect"
                className="relative w-14 h-14 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Tv className="w-8 h-8 text-benfica-blue" />
                TV Displays
              </h1>
              <p className="text-benfica-blue font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Selecione um display para exibição nas TVs
              </p>
            </div>
          </div>
          <div className="text-right bg-black/30 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-5 w-5 text-benfica-blue" />
              <span className="text-3xl font-mono font-bold text-white">
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {currentTime.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>

        {/* Display Options Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {tvDisplayOptions.map((option) => {
            const Icon = option.icon;
            const isHovered = hoveredCard === option.id;

            return (
              <div
                key={option.id}
                className={`relative group bg-black/40 backdrop-blur-3xl rounded-3xl border transition-all duration-500 overflow-hidden ${isHovered
                  ? 'border-white/30 scale-[1.02] shadow-2xl'
                  : 'border-white/10'
                  }`}
                onMouseEnter={() => setHoveredCard(option.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${option.gradientFrom}/10 ${option.gradientTo}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

                {/* Number Badge */}
                <div className={`absolute top-4 left-4 w-10 h-10 bg-gradient-to-br ${option.gradientFrom} ${option.gradientTo} rounded-xl flex items-center justify-center font-black text-lg shadow-lg`}>
                  {option.id}
                </div>

                {/* Content */}
                <div className="p-8 pt-16">
                  <div className="flex items-start gap-6">
                    <div className={`p-5 bg-gradient-to-br ${option.gradientFrom} ${option.gradientTo} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-black text-white mb-2">{option.title}</h2>
                      <p className="text-slate-400 font-medium leading-relaxed">{option.description}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => handleOpenDisplay(option.route, false)}
                      className={`flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r ${option.gradientFrom} ${option.gradientTo} text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-white/20`}
                    >
                      <Play className="w-5 h-5" />
                      Abrir Display
                    </button>
                    <button
                      onClick={() => handleOpenDisplay(option.route, true)}
                      className="flex items-center justify-center gap-2 px-5 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-bold rounded-xl transition-all duration-300 border border-white/10 hover:border-white/30"
                      title="Abrir em nova aba"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        const win = window.open(option.route, '_blank');
                        if (win) {
                          setTimeout(() => {
                            win.document.documentElement.requestFullscreen?.();
                          }, 500);
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-5 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-bold rounded-xl transition-all duration-300 border border-white/10 hover:border-white/30"
                      title="Abrir em tela cheia"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Route indicator */}
                <div className="absolute bottom-4 right-4">
                  <span className="text-xs text-slate-500 font-mono bg-black/30 px-2 py-1 rounded">
                    {option.route}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 bg-black/30 backdrop-blur-xl rounded-xl p-3 border border-white/10 mt-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-slate-400 font-medium">Sistema Online</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-sm text-slate-500">BBT Connect • Central de TV Displays</span>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-sm text-slate-500">{tvDisplayOptions.length} displays disponíveis</span>
        </div>
      </div>
    </div>
  );
}
