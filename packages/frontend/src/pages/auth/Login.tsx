import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Truck, Shield, MapPin, Lock, Mail, ArrowRight, Sparkles, Radio } from 'lucide-react';
import { VideoBackground } from '@/components/ui';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard/operador');
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white font-sans">
      {/* Camada de Background - Video BBT */}
      <VideoBackground
        videoSrc="/background-bbt.webm"
        fallbackToAnimated={true}
      />

      {/* Conteúdo Principal */}
      <div className="relative z-10 min-h-screen flex">
        {/* Lado esquerdo - Branding (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
          <div className="space-y-8 animate-fadeIn">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-2 bg-benfica-blue/30 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                <img
                  src="/bbt-connect-logo-truck.png"
                  alt="BBT Connect"
                  className="relative w-20 h-20 object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">BBT Connect</h1>
                <p className="text-benfica-blue font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Sistema de Gestão
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
                Segurança e eficiência para sua operação logística.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { icon: Truck, text: 'Frota em Tempo Real' },
                { icon: MapPin, text: 'Rastreamento GPS' },
                { icon: Shield, text: 'Segurança Total' },
                { icon: Radio, text: 'Comunicação Direta' },
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
                <span className="text-sm text-slate-400">24 Veículos Ativos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md animate-slideUp">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <img
                  src="/bbt-connect-logo.png"
                  alt="BBT Connect"
                  className="w-14 h-14 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-white">BBT Connect</h1>
              <p className="text-benfica-blue text-sm">Sistema de Gestão</p>
            </div>

            {/* Card do formulário - Glassmorphism */}
            <div className="bg-slate-950/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-10 border border-white/10 hover:border-white/20 transition-all duration-300">
              {/* Header do card */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-benfica-red to-red-700 rounded-2xl mb-4 shadow-lg shadow-benfica-red/30">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Acesso ao Sistema</h2>
                <p className="text-slate-400 mt-1">Entre com suas credenciais</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-xl
                               focus:border-benfica-blue focus:ring-2 focus:ring-benfica-blue/20
                               outline-none transition-all duration-200 text-white font-medium
                               placeholder:text-slate-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Erro */}
                {error && (
                  <div className="bg-benfica-red/10 border border-benfica-red/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-benfica-red rounded-full animate-pulse" />
                    {error}
                  </div>
                )}

                {/* Lembrar-me e Esqueceu senha */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-benfica-blue focus:ring-benfica-blue/20" />
                    <span className="text-slate-400">Lembrar-me</span>
                  </label>
                  <a href="#" className="text-benfica-blue hover:text-blue-400 font-semibold transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>

                {/* Botão Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-benfica-red to-red-700 text-white py-4 rounded-xl
                           font-bold text-lg shadow-lg shadow-benfica-red/30
                           hover:from-red-600 hover:to-red-800 hover:shadow-benfica-red/50 hover:-translate-y-0.5
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
                      Acessar Sistema
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-950/40 px-4 text-sm text-slate-500">ou</span>
                </div>
              </div>

              {/* Botão secundário */}
              <button
                type="button"
                className="w-full bg-benfica-blue/10 text-benfica-blue py-4 rounded-xl
                         font-bold border border-benfica-blue/30
                         hover:bg-benfica-blue/20 hover:border-benfica-blue/50 hover:-translate-y-0.5
                         active:translate-y-0 transition-all duration-200"
              >
                Solicitar Acesso
              </button>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-slate-500 text-sm">
                Acesso restrito a usuários autorizados
              </p>
              <p className="text-slate-600 text-xs mt-1">
                BBT Connect © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
