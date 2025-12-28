import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Shield, RefreshCw, LogOut } from 'lucide-react';
import { OscarAvatar } from '@/components/OscarAvatar';
import { supabase } from '@/integrations/supabase/client';

interface MFAVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerification({ onSuccess, onCancel }: MFAVerificationProps) {
  const { verifyMFAChallenge, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    if (data?.totp && data.totp.length > 0) {
      setFactorId(data.totp[0].id);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Entrez un code à 6 chiffres');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await verifyMFAChallenge(factorId, code);
      if (error) {
        setError('Code incorrect. Réessayez.');
        setCode('');
      } else {
        toast.success('Connexion réussie !');
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.length === 6 && factorId) {
      handleVerify();
    }
  }, [code, factorId]);

  const handleLogout = async () => {
    await signOut();
    onCancel();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <OscarAvatar size="lg" />
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto -mt-8 relative z-10">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Vérification requise
            </h1>
            <p className="text-muted-foreground mt-2 text-lg leading-relaxed">
              Ouvrez votre application <strong>Google Authenticator</strong> et entrez le code à 6 chiffres
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                setError('');
              }}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-14 text-2xl" />
                <InputOTPSlot index={1} className="w-12 h-14 text-2xl" />
                <InputOTPSlot index={2} className="w-12 h-14 text-2xl" />
                <InputOTPSlot index={3} className="w-12 h-14 text-2xl" />
                <InputOTPSlot index={4} className="w-12 h-14 text-2xl" />
                <InputOTPSlot index={5} className="w-12 h-14 text-2xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {loading && (
            <p className="text-center text-muted-foreground animate-pulse text-lg">
              Vérification en cours...
            </p>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
              <p className="text-destructive font-medium">{error}</p>
              <button
                onClick={() => setCode('')}
                className="text-destructive/80 text-sm mt-1 flex items-center justify-center gap-1 mx-auto hover:underline"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full h-14 text-lg"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Utiliser un autre compte
          </Button>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Le code change toutes les 30 secondes
          </p>
        </div>
      </div>
    </div>
  );
}