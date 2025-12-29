import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OscarAvatar } from '@/components/OscarAvatar';
import { MFAVerification } from '@/components/MFAVerification';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Users, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AccountType = 'senior' | 'family_member';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('senior');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const { data: role } = await supabase.rpc('get_user_role', { _user_id: userId });
      if (role === 'family_member') {
        navigate('/family');
      } else {
        navigate('/');
      }
    } catch {
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error, mfaRequired, data } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou mot de passe incorrect');
          } else {
            toast.error(error.message);
          }
        } else if (mfaRequired) {
          setShowMFAVerification(true);
        } else {
          toast.success('Connexion réussie !');
          if (data?.user?.id) {
            await redirectBasedOnRole(data.user.id);
          } else {
            navigate('/');
          }
        }
      } else {
        if (!fullName.trim()) {
          toast.error('Veuillez entrer votre nom');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, accountType);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Cet email est déjà utilisé');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Compte créé avec succès !');
          navigate(accountType === 'family_member' ? '/family' : '/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMFASuccess = async () => {
    setShowMFAVerification(false);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id) {
      await redirectBasedOnRole(currentUser.id);
    } else {
      navigate('/');
    }
  };

  const handleMFACancel = () => {
    setShowMFAVerification(false);
    setEmail('');
    setPassword('');
  };

  if (showMFAVerification) {
    return <MFAVerification onSuccess={handleMFASuccess} onCancel={handleMFACancel} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4 flex flex-col items-center">
          <OscarAvatar size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? 'Bon retour !' : 'Bienvenue !'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLogin ? 'Connectez-vous pour continuer' : 'Créez votre compte'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Account Type Selection */}
              <div className="space-y-2">
                <Label>Type de compte</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('senior')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      accountType === 'senior'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Heart className={`w-8 h-8 mx-auto mb-2 ${accountType === 'senior' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medium text-sm">Senior</p>
                    <p className="text-xs text-muted-foreground">Utilisateur principal</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('family_member')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      accountType === 'family_member'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Users className={`w-8 h-8 mx-auto mb-2 ${accountType === 'family_member' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medium text-sm">Famille</p>
                    <p className="text-xs text-muted-foreground">Suivi d'un proche</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Votre nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline text-sm"
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}
