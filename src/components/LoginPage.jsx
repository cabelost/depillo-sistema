import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', fullName: '', role: 'depiladora' });
  const { toast } = useToast();

  const isSupabaseConnected = !!supabase;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!isSupabaseConnected) {
        toast({
            title: 'Integração Necessária',
            description: 'A integração com o Supabase não foi concluída. Por favor, complete a integração para fazer login.',
            variant: 'destructive',
            duration: 9000,
        });
        return;
    }
    onLogin(form);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!isSupabaseConnected) {
        toast({
            title: 'Integração Necessária',
            description: 'A integração com o Supabase não foi concluída. Por favor, complete a integração para se registrar.',
            variant: 'destructive',
            duration: 9000,
        });
        return;
    }
    const { email, password, fullName, role } = registerForm;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) {
      toast({ title: "Erro no Cadastro", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "✅ Cadastro realizado!", 
        description: "Enviamos um link de confirmação para o seu email. Por favor, confirme antes de fazer o login.",
        duration: 9000
      });
      setIsRegistering(false);
      setRegisterForm({ email: '', password: '', fullName: '', role: 'depiladora' });
    }
  };
  
  const renderLoginForm = () => (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="text-center mb-8">
            <img  class="w-24 h-24 mx-auto mb-4" alt="Logotipo da empresa" src="https://storage.googleapis.com/hostinger-horizons-assets-prod/f2177655-6c43-40d3-891d-9ff6f60fa816/a342e8069d452785e953f9867a4e92bb.png" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Sistema de Fila Virtual</h1>
            <p className="text-slate-500">Faça login para acessar o sistema</p>
        </div>
        {!isSupabaseConnected && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
                <p className="font-bold">Ação Necessária</p>
                <p>A configuração do banco de dados (Supabase) não foi concluída. Por favor, termine a integração para habilitar o login.</p>
            </div>
        )}
        <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                placeholder="seu@email.com"
                required
                disabled={!isSupabaseConnected}
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                placeholder="Digite sua senha"
                required
                disabled={!isSupabaseConnected}
              />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isSupabaseConnected}>
              Entrar
            </Button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Não tem uma conta?{' '}
            <Button variant="link" className="text-red-600 p-0 h-auto" onClick={() => setIsRegistering(true)} disabled={!isSupabaseConnected}>
              Cadastre-se
            </Button>
          </p>
        </div>
     </motion.div>
  );

  const renderRegisterForm = () => (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Criar Nova Conta</h1>
        {!isSupabaseConnected && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
                <p className="font-bold">Ação Necessária</p>
                <p>A configuração do banco de dados (Supabase) não foi concluída. Por favor, termine a integração para habilitar o registro.</p>
            </div>
        )}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">Nome Completo</label>
              <input
                type="text"
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg disabled:opacity-50"
                placeholder="Ex: Maria Silva"
                required
                disabled={!isSupabaseConnected}
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg disabled:opacity-50"
                placeholder="seu@email.com"
                required
                disabled={!isSupabaseConnected}
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">Senha</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg disabled:opacity-50"
                placeholder="Mínimo 6 caracteres"
                required
                disabled={!isSupabaseConnected}
              />
            </div>
             <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">Função</label>
                <select 
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg disabled:opacity-50"
                    disabled={!isSupabaseConnected}
                >
                    <option value="depiladora">Depiladora</option>
                    <option value="recepcao">Recepção</option>
                    <option value="fila_publica">Fila Pública</option>
                </select>
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isSupabaseConnected}>
              Cadastrar
            </Button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Já tem uma conta?{' '}
            <Button variant="link" className="text-red-600 p-0 h-auto" onClick={() => setIsRegistering(false)} disabled={!isSupabaseConnected}>
              Faça login
            </Button>
          </p>
        </div>
     </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Sistema de Fila Virtual - {isRegistering ? 'Cadastro' : 'Login'}</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl border border-gray-200"
        >
          {isRegistering ? renderRegisterForm() : renderLoginForm()}
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;