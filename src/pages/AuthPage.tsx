import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { OscarAvatar } from '@/components/OscarAvatar';
import { MFAVerification } from '@/components/MFAVerification';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Users, Heart, Phone, ArrowLeft, PhoneCall, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AccountType = 'senior' | 'family_member';
type AuthStep =
  | 'choose_type'       // Étape 1 : Senior ou Famille ?
  | 'senior_phone'      // Étape 2a : Numéro + nom (si 1ère fois)
  | 'senior_calling'    // Étape 3a : Oscar vous appelle...
  | 'senior_code'       // Étape 4a : Saisir le code
  | 'family_auth';      // Étape 2b : Email/password classique

export function AuthPage() {
  // --- State machine ---
  const [step, setStep] = useState<AuthStep>('choose_type');
  const [accountType, setAccountType] = useState<AccountType>('senior');

  // Senior phone flow
  const [phoneNumber, setPhoneNumber] = useState('');
  const [seniorName, setSeniorName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Family email flow
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);

  const { signIn, signUp, signInWithPhone, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();

  // --- Helpers ---
  const formatPhoneForDisplay = (phone: string) => {
    const clean = phone.replace(/\s/g, '');
    if (clean.startsWith('+33')) return clean;
    if (clean.startsWith('0')) return '+33' + clean.slice(1);
    return clean;
  };

  const formatPhoneForApi = (phone: string) => {
    const clean = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
    if (clean.startsWith('+33')) return clean;
    if (clean.startsWith('0')) return '+33' + clean.slice(1);
    if (clean.startsWith('33')) return '+' + clean;
    return '+33' + clean;
  };

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

  // --- Senior phone flow handlers ---
  const handleSendPhoneCode = async () => {
    const formattedPhone = formatPhoneForApi(phoneNumber);
    if (formattedPhone.length < 12) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setPhoneLoading(true);
    setStep('senior_calling');

    try {
      const { error } = await signInWithPhone(formattedPhone);
      if (error) {
        console.error('[Auth] Phone OTP error:', error);
        toast.error("Impossible d'appeler ce numéro. Vérifiez-le et réessayez.");
        setStep('senior_phone');
      } else {
        // L'appel a été initié, passer à la saisie du code
        setStep('senior_code');
      }
    } catch (err) {
      console.error('[Auth] Phone OTP exception:', err);
      toast.error("Erreur lors de l'appel. Réessayez.");
      setStep('senior_phone');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (code.length !== 6) return;

    setVerifyLoading(true);
    const formattedPhone = formatPhoneForApi(phoneNumber);

    try {
      const { error, user } = await verifyPhoneOtp(formattedPhone, code);
      if (error) {
        toast.error('Code incorrect. Vérifiez et réessayez.');
        setOtpCode('');
      } else {
        // Si un nom a été fourni (1ère connexion), mettre à jour le profil
        if (seniorName.trim() && user?.id) {
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: seniorName.trim(),
            phone_number: formattedPhone,
          });
          await supabase.auth.updateUser({
            data: { full_name: seniorName.trim(), role: 'senior' },
          });
        }

        toast.success('Connexion réussie !');
        navigate('/');
      }
    } catch (err) {
      console.error('[Auth] Verify error:', err);
      toast.error('Erreur de vérification. Réessayez.');
      setOtpCode('');
    } finally {
      setVerifyLoading(false);
    }
  };

  // --- Family email flow handlers ---
  const handleFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFamilyLoading(true);

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
            navigate('/family');
          }
        }
      } else {
        if (!fullName.trim()) {
          toast.error('Veuillez entrer votre nom');
          setFamilyLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, 'family_member');
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Cet email est déjà utilisé');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Compte créé avec succès !');
          navigate('/family');
        }
      }
    } finally {
      setFamilyLoading(false);
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

  // --- MFA screen ---
  if (showMFAVerification) {
    return <MFAVerification onSuccess={handleMFASuccess} onCancel={handleMFACancel} />;
  }

  // ─────────────────────────────────────────────────────────
  // ÉTAPE 1 : Choix du type de compte
  // ─────────────────────────────────────────────────────────
  if (step === 'choose_type') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-4 flex flex-col items-center">
            <OscarAvatar size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bienvenue !</h1>
              <p className="text-muted-foreground mt-1">Qui êtes-vous ?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base">Type de compte</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('senior')}
                className={`p-5 rounded-xl border-2 transition-all ${
                  accountType === 'senior'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Heart className={`w-10 h-10 mx-auto mb-2 ${accountType === 'senior' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-semibold text-base">Senior</p>
                <p className="text-sm text-muted-foreground">Utilisateur principal</p>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('family_member')}
                className={`p-5 rounded-xl border-2 transition-all ${
                  accountType === 'family_member'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Users className={`w-10 h-10 mx-auto mb-2 ${accountType === 'family_member' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-semibold text-base">Famille</p>
                <p className="text-sm text-muted-foreground">Suivi d'un proche</p>
              </button>
            </div>
          </div>

          <Button
            className="w-full h-14 text-lg"
            onClick={() => setStep(accountType === 'senior' ? 'senior_phone' : 'family_auth')}
          >
            Continuer
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ÉTAPE 2a : Senior — Numéro de téléphone
  // ─────────────────────────────────────────────────────────
  if (step === 'senior_phone') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Retour */}
          <button
            onClick={() => setStep('choose_type')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Retour</span>
          </button>

          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Connexion par téléphone</h1>
              <p className="text-muted-foreground mt-1 text-base leading-relaxed">
                Oscar vous appellera pour vous donner votre code de connexion.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Nom (optionnel — pour la 1ère fois) */}
            <div className="space-y-2">
              <Label htmlFor="seniorName" className="text-base">Votre prénom</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="seniorName"
                  type="text"
                  placeholder="Jean"
                  value={seniorName}
                  onChange={(e) => setSeniorName(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </div>
              <p className="text-xs text-muted-foreground">Nécessaire seulement la première fois</p>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">Numéro de téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-12 h-14 text-lg tracking-wide"
                  autoComplete="tel"
                />
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg gap-3"
              onClick={handleSendPhoneCode}
              disabled={phoneLoading || !phoneNumber.trim()}
            >
              {phoneLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PhoneCall className="w-5 h-5" />
              )}
              M'appeler pour le code
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ÉTAPE 3a : Senior — Oscar vous appelle...
  // ─────────────────────────────────────────────────────────
  if (step === 'senior_calling') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <PhoneCall className="w-12 h-12 text-primary" />
              </div>
              {/* Cercle d'animation */}
              <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-primary/20 animate-ping" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Oscar vous appelle...</h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                Décrochez votre téléphone et notez le code qu'Oscar va vous dicter.
              </p>
              <p className="text-primary font-medium mt-3 text-lg">
                {formatPhoneForDisplay(phoneNumber)}
              </p>
            </div>
          </div>

          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ÉTAPE 4a : Senior — Saisir le code
  // ─────────────────────────────────────────────────────────
  if (step === 'senior_code') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Retour */}
          <button
            onClick={() => { setStep('senior_phone'); setOtpCode(''); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Retour</span>
          </button>

          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Phone className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Entrez votre code</h1>
              <p className="text-muted-foreground mt-1 text-base leading-relaxed">
                Oscar vous a dicté un code à 6 chiffres par téléphone.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => {
                setOtpCode(value);
                if (value.length === 6) {
                  handleVerifyCode(value);
                }
              }}
              disabled={verifyLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
              </InputOTPGroup>
            </InputOTP>

            {verifyLoading && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-base">Vérification...</span>
              </div>
            )}
          </div>

          {/* Renvoyer le code */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Vous n'avez pas reçu l'appel ?</p>
            <Button
              variant="outline"
              className="h-12 text-base gap-2"
              onClick={() => {
                setOtpCode('');
                handleSendPhoneCode();
              }}
              disabled={phoneLoading}
            >
              <PhoneCall className="w-4 h-4" />
              Rappeler
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ÉTAPE 2b : Famille — Email / Mot de passe
  // ─────────────────────────────────────────────────────────
  if (step === 'family_auth') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Retour */}
          <button
            onClick={() => setStep('choose_type')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Retour</span>
          </button>

          <div className="text-center space-y-4 flex flex-col items-center">
            <OscarAvatar size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isLogin ? 'Bon retour !' : 'Espace Famille'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isLogin ? 'Connectez-vous pour continuer' : 'Créez votre compte famille'}
              </p>
            </div>
          </div>

          <form onSubmit={handleFamilySubmit} className="space-y-4">
            {!isLogin && (
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

            <Button type="submit" className="w-full h-12 text-base" disabled={familyLoading}>
              {familyLoading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
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

  return null;
}
