import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { QrCode, Shield, CheckCircle2, Smartphone, ArrowRight, X } from 'lucide-react';

interface MFAEnrollmentProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAEnrollment({ onSuccess, onCancel }: MFAEnrollmentProps) {
  const { enrollMFA, verifyMFA } = useAuth();
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'success'>('intro');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartEnrollment = async () => {
    setLoading(true);
    try {
      const { data, error } = await enrollMFA();
      if (error) {
        toast.error('Erreur lors de l\'activation');
        return;
      }
      if (data && data.type === 'totp') {
        setQrCodeUrl(data.totp.qr_code);
        setFactorId(data.id);
        setSecret(data.totp.secret);
        setStep('qr');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Entrez un code à 6 chiffres');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await verifyMFA(factorId, code);
      if (error) {
        toast.error('Code incorrect. Réessayez.');
        setCode('');
      } else {
        setStep('success');
        toast.success('Double authentification activée !');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  if (step === 'intro') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 space-y-6 shadow-lg">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Double authentification
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Protégez votre compte avec un code de sécurité supplémentaire. 
              Vous aurez besoin d'une application comme <strong>Google Authenticator</strong>.
            </p>
          </div>

          <div className="space-y-3 bg-secondary/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <p className="text-foreground pt-1">
                Téléchargez <strong>Google Authenticator</strong> sur votre téléphone
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <p className="text-foreground pt-1">
                Scannez le QR code avec l'application
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                3
              </div>
              <p className="text-foreground pt-1">
                Entrez le code à 6 chiffres affiché
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-14 text-lg" onClick={onCancel}>
              Annuler
            </Button>
            <Button 
              className="flex-1 h-14 text-lg" 
              onClick={handleStartEnrollment}
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Commencer'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 space-y-6 shadow-lg">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Smartphone className="w-6 h-6" />
              <span className="text-lg font-medium">Étape 1 sur 2</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Scannez ce QR code
            </h2>
            <p className="text-muted-foreground text-lg">
              Ouvrez Google Authenticator et scannez ce code
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 mx-auto w-fit">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="bg-secondary/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Impossible de scanner ? Entrez ce code manuellement :
            </p>
            <p className="font-mono text-center text-lg font-bold text-foreground break-all">
              {secret}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-14 text-lg" onClick={onCancel}>
              Annuler
            </Button>
            <Button className="flex-1 h-14 text-lg" onClick={() => setStep('verify')}>
              Suivant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 space-y-6 shadow-lg">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Shield className="w-6 h-6" />
              <span className="text-lg font-medium">Étape 2 sur 2</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Entrez le code
            </h2>
            <p className="text-muted-foreground text-lg">
              Tapez le code à 6 chiffres affiché dans Google Authenticator
            </p>
          </div>

          <div className="flex justify-center py-4">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
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
            <p className="text-center text-muted-foreground animate-pulse">
              Vérification en cours...
            </p>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-14 text-lg" 
              onClick={() => setStep('qr')}
              disabled={loading}
            >
              Retour
            </Button>
            <Button 
              className="flex-1 h-14 text-lg" 
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success step
  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 space-y-6 shadow-lg">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            C'est activé !
          </h2>
          <p className="text-muted-foreground text-lg">
            Votre compte est maintenant protégé par la double authentification.
            Vous devrez entrer un code à chaque connexion.
          </p>
        </div>

        <Button className="w-full h-14 text-lg" onClick={onSuccess}>
          Terminé
        </Button>
      </div>
    </div>
  );
}