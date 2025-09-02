import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import PublicQueue from '@/components/PublicQueue';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function App() {
  const { session, user, signOut } = useAuth();
  const [currentUserData, setCurrentUserData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({ title: "❌ Erro ao buscar perfil", description: "Não foi possível carregar os dados do seu perfil.", variant: "destructive" });
        }
        
        const userData = {
          id: user.id,
          email: user.email,
          name: profile?.full_name || user.user_metadata?.full_name || 'Usuário',
          role: profile?.role || user.user_metadata?.role || 'depiladora',
        };
        setCurrentUserData(userData);
      };
      fetchProfile();
    } else {
      setCurrentUserData(null);
    }
  }, [user, toast]);

  const handleLogin = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Email not confirmed') {
        toast({
          title: "📧 Email não confirmado",
          description: "Por favor, verifique sua caixa de entrada e confirme seu email antes de fazer login.",
          variant: "destructive",
          duration: 9000,
        });
      } else {
        toast({
          title: "❌ Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive",
        });
      }
      return;
    }

    if (data.user) {
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', data.user.id)
        .maybeSingle();
      
      if (profileError) {
          console.error("Login profile fetch error:", profileError);
          toast({ title: "❌ Erro ao buscar perfil", description: "Houve um problema ao carregar seus dados.", variant: "destructive" });
          return;
      }

      if (!profile) {
        const fullName = data.user.user_metadata?.full_name;
        const role = data.user.user_metadata?.role;

        if (!fullName || !role) {
            toast({ title: "❌ Dados de perfil incompletos", description: "Não foi possível encontrar seu nome e função.", variant: "destructive" });
            return;
        }

        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, full_name: fullName, role: role })
            .select()
            .single();
        
        if (createError) {
            console.error("Error creating profile:", createError);
            toast({ title: "❌ Erro ao criar perfil", description: "Não foi possível configurar sua conta.", variant: "destructive" });
            return;
        }
        profile = newProfile;
      }

      if (profile.role === 'depiladora') {
        const { error: statusError } = await supabase
          .from('depiladoras_status')
          .upsert({
            id: data.user.id,
            name: profile.full_name,
            status: 'online',
            last_login: new Date().toISOString()
          }, { onConflict: 'id' });

        if (statusError) {
          console.error("Supabase login status error:", statusError);
          toast({ title: "❌ Erro de Sincronização", description: statusError.message, variant: "destructive" });
        }
      }
      
      toast({
        title: "✅ Login realizado com sucesso!",
        description: `Bem-vindo(a), ${profile.full_name}!`,
      });
    }
  };

  const handleLogout = async () => {
    const userIdToUpdate = currentUserData?.id;
    const userRole = currentUserData?.role;
    
    await signOut();
    setCurrentUserData(null);
    sessionStorage.removeItem('activeAttendanceId');

    if (userRole === 'depiladora' && userIdToUpdate) {
        const { error } = await supabase
          .from('depiladoras_status')
          .update({ status: 'offline', last_login: null })
          .eq('id', userIdToUpdate);

        if (error) {
          console.error("Supabase status update on logout error:", error);
        }
    }
    
    toast({
      title: "👋 Logout realizado",
      description: "Até logo!",
    });
  };
  
  const renderContent = () => {
    if (!session || !currentUserData) {
      return <LoginPage onLogin={handleLogin} />;
    }

    if (currentUserData.role === 'fila_publica') {
      return <PublicQueue onLogout={handleLogout} />;
    }

    return (
      <Dashboard 
        key={currentUserData.id}
        currentUser={currentUserData} 
        onLogout={handleLogout}
      />
    );
  };

  return <>{renderContent()}</>;
}

export default App;