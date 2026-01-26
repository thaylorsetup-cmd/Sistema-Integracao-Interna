import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getDefaultRoute } from '@/contexts';
import { Truck, Shield, MapPin, Mail, ArrowRight, Sparkles, Radio, BarChart3, Lock, Eye, EyeOff } from 'lucide-react';
import { LightVideoBackground } from '@/components/ui';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      navigate(getDefaultRoute(user.role));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Credenciais invalidas';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white font-sans">
      {/* Camada de Background - Video BBT Leve */}
      <LightVideoBackground
        videoSrc="/background-bbt.webm"
        gifFallback="/background-bbt-small.gif"
        opacity={0.2}
      />

      {/* Conteudo Principal */}
      <div className="relative z-10 min-h-screen flex">
        {/* Lado esquerdo - Branding (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
          <div className="space-y-8 animate-fadeIn">
            {/* Logo - Igual ao interior do sistema */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-2 bg-benfica-blue/30 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-3 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-2xl shadow-lg shadow-benfica-blue/30 border border-white/20">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">BBT Connect</h1>
                <p className="text-benfica-blue font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Sistema de Gestao
                </p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-5xl xl:text-6xl font-black text-white leading-tight">
                Centro de
                <span className="block text-benfica-blue">Comando</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-md leading-relaxed">
                Sistema completo de monitoramento de frotas em tempo real.
                Seguranca e eficiencia para sua operacao logistica.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { icon: Truck, text: 'Frota em Tempo Real' },
                { icon: MapPin, text: 'Rastreamento GPS' },
                { icon: Shield, text: 'Seguranca Total' },
                { icon: Radio, text: 'Comunicacao Direta' },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-slate-950/40 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10 hover:border-benfica-blue/30 hover:bg-slate-950/60 transition-all duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="p-2 rounded-lg bg-benfica-blue/20">
                    <feature.icon className="w-5 h-5 text-benfica-blue" />
                  </div>
                  <span className="text-white font-medium text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm text-slate-400">Sistema Online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-benfica-blue"></span>
                <span className="text-sm text-slate-400">24 Veiculos Ativos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado direito - Formulario */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md animate-slideUp">
            {/* Mobile Logo - Igual ao interior */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-xl shadow-lg shadow-benfica-blue/30 border border-white/20">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">BBT Connect</h1>
              <p className="text-benfica-blue text-sm">Sistema de Gestao</p>
            </div>

            {/* Card do formulario - Glassmorphism */}
            <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-10 border border-white/10 hover:border-benfica-blue/20 transition-all duration-300">
              {/* Header do card */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-2xl mb-4 shadow-lg shadow-benfica-blue/30 border border-white/20">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Acesso ao Sistema</h2>
                <p className="text-slate-400 mt-1">Digite suas credenciais para entrar</p>
              </div>

              {/* Formulario de Login */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-xl
                               focus:border-benfica-blue focus:ring-2 focus:ring-benfica-blue/20
                               outline-none transition-all duration-200 text-white font-medium
                               placeholder:text-slate-500"
                      placeholder="seu@email.com"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-900/50 border border-white/10 rounded-xl
                               focus:border-benfica-blue focus:ring-2 focus:ring-benfica-blue/20
                               outline-none transition-all duration-200 text-white font-medium
                               placeholder:text-slate-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Erro */}
                {error && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    {error}
                  </div>
                )}

                {/* Botao Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-benfica-blue to-blue-700 text-white py-4 rounded-xl
                           font-bold text-lg shadow-lg shadow-benfica-blue/30
                           hover:from-blue-600 hover:to-blue-800 hover:shadow-benfica-blue/50 hover:-translate-y-0.5
                           active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 flex items-center justify-center gap-2
                           border border-white/10"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-slate-500 text-sm">
                Acesso restrito a usuarios autorizados
              </p>
              <p className="text-slate-600 text-xs mt-1">
                BBT Connect &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
