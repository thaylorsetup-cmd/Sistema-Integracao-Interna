/**
 * AnimatedBackground - Componente de fundo animado estilo BBT
 * Simula um vídeo de fundo com SVG animado de caminhões e estradas
 * Pode ser substituído por vídeo real quando disponível
 */

interface AnimatedBackgroundProps {
  variant?: 'dark' | 'light';
  showOverlay?: boolean;
  className?: string;
}

export function AnimatedBackground({
  variant = 'dark',
  showOverlay = true,
  className = ''
}: AnimatedBackgroundProps) {
  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div className={`absolute inset-0 ${variant === 'dark'
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'
        }`} />

      {/* Animated SVG Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Road pattern */}
          <pattern id="roadPattern" width="200" height="20" patternUnits="userSpaceOnUse">
            <rect width="200" height="20" fill="#1e293b" />
            <line x1="0" y1="10" x2="30" y2="10" stroke="#fbbf24" strokeWidth="2" strokeDasharray="20 10" />
            <line x1="50" y1="10" x2="80" y2="10" stroke="#fbbf24" strokeWidth="2" strokeDasharray="20 10" />
            <line x1="100" y1="10" x2="130" y2="10" stroke="#fbbf24" strokeWidth="2" strokeDasharray="20 10" />
            <line x1="150" y1="10" x2="180" y2="10" stroke="#fbbf24" strokeWidth="2" strokeDasharray="20 10" />
          </pattern>

          {/* Grid pattern for city */}
          <pattern id="cityGrid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.3" />
          </pattern>

          {/* Glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Truck icon */}
          <symbol id="truck" viewBox="0 0 40 20">
            <rect x="0" y="5" width="25" height="12" rx="2" fill="#ED1C24" />
            <rect x="25" y="8" width="12" height="9" rx="1" fill="#0072BC" />
            <circle cx="8" cy="17" r="3" fill="#1e293b" stroke="#B1B3B6" strokeWidth="1" />
            <circle cx="20" cy="17" r="3" fill="#1e293b" stroke="#B1B3B6" strokeWidth="1" />
            <circle cx="32" cy="17" r="3" fill="#1e293b" stroke="#B1B3B6" strokeWidth="1" />
            <rect x="27" y="9" width="8" height="5" rx="1" fill="#75CEFF" opacity="0.8" />
          </symbol>
        </defs>

        {/* City grid background */}
        <rect width="100%" height="100%" fill="url(#cityGrid)" />

        {/* Roads */}
        <g>
          {/* Main horizontal highway */}
          <rect x="0" y="300" width="1920" height="40" fill="url(#roadPattern)">
            <animate attributeName="x" from="0" to="-200" dur="2s" repeatCount="indefinite" />
          </rect>

          {/* Secondary road */}
          <rect x="0" y="600" width="1920" height="30" fill="url(#roadPattern)" opacity="0.7">
            <animate attributeName="x" from="-200" to="0" dur="3s" repeatCount="indefinite" />
          </rect>

          {/* Third road */}
          <rect x="0" y="850" width="1920" height="25" fill="url(#roadPattern)" opacity="0.5">
            <animate attributeName="x" from="0" to="-200" dur="4s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Animated trucks on highway 1 */}
        <g filter="url(#glow)">
          <use href="#truck" x="-100" y="290" width="60" height="30">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="2100 0"
              dur="12s"
              repeatCount="indefinite"
            />
          </use>
          <use href="#truck" x="-400" y="295" width="50" height="25">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="2400 0"
              dur="15s"
              repeatCount="indefinite"
            />
          </use>
          <use href="#truck" x="-700" y="292" width="55" height="28">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="2700 0"
              dur="18s"
              repeatCount="indefinite"
            />
          </use>
        </g>

        {/* Animated trucks on highway 2 (reverse) */}
        <g filter="url(#glow)">
          <use href="#truck" x="2000" y="590" width="50" height="25" transform="scale(-1, 1)">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="-2200 0"
              dur="14s"
              repeatCount="indefinite"
            />
          </use>
          <use href="#truck" x="2300" y="592" width="45" height="22" transform="scale(-1, 1)">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="-2500 0"
              dur="16s"
              repeatCount="indefinite"
            />
          </use>
        </g>

        {/* Animated trucks on highway 3 */}
        <g filter="url(#glow)">
          <use href="#truck" x="-200" y="840" width="45" height="22">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="2300 0"
              dur="20s"
              repeatCount="indefinite"
            />
          </use>
        </g>

        {/* BBT Matriz marker */}
        <g transform="translate(960, 540)">
          <circle r="60" fill="#ED1C24" opacity="0.1">
            <animate attributeName="r" values="60;80;60" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle r="40" fill="#ED1C24" opacity="0.2">
            <animate attributeName="r" values="40;55;40" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="25" fill="#ED1C24" stroke="#ffffff" strokeWidth="3" />
          <text x="0" y="5" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">BBT</text>
        </g>

        {/* Destination markers */}
        <g opacity="0.6">
          <circle cx="200" cy="300" r="15" fill="#0072BC">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="1700" cy="600" r="15" fill="#0072BC">
            <animate attributeName="opacity" values="1;0.6;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="400" cy="850" r="12" fill="#22C55E">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="1500" cy="300" r="12" fill="#22C55E">
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Route lines connecting */}
        <g stroke="#0072BC" strokeWidth="2" fill="none" opacity="0.3">
          <path d="M 960 540 Q 580 420 200 300">
            <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="5s" repeatCount="indefinite" />
          </path>
          <path d="M 960 540 Q 1330 570 1700 600">
            <animate attributeName="stroke-dashoffset" from="0" to="1000" dur="6s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>

      {/* Overlay for contrast */}
      {showOverlay && (
        <div className={`absolute inset-0 ${variant === 'dark'
            ? 'bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/50'
            : 'bg-gradient-to-t from-white via-white/70 to-slate-100/50'
          }`} />
      )}

      {/* Subtle animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${variant === 'dark' ? 'bg-white/20' : 'bg-slate-400/30'
              }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * VideoBackground - Versão LEVE usando gradiente CSS animado
 * Otimizado para performance máxima sem travamentos
 * Substitui o vídeo pesado por animação CSS pura
 */
interface VideoBackgroundProps {
  videoSrc?: string;
  fallbackToAnimated?: boolean;
  className?: string;
}

export function VideoBackground({
  className = ''
}: VideoBackgroundProps) {
  return (
    <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
      {/* Gradiente base animado - cores BBT */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e3a5f 75%, #0f172a 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
        }}
      />

      {/* Camada com padrão sutil */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(237, 28, 36, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 114, 188, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 70%)
          `,
        }}
      />

      {/* Orbes animados leves */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(237, 28, 36, 0.4) 0%, transparent 70%)',
          top: '10%',
          left: '5%',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(0, 114, 188, 0.4) 0%, transparent 70%)',
          bottom: '10%',
          right: '10%',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />

      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />

      {/* CSS Animations */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
