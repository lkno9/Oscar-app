import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, AuthMFAEnrollResponse, Factor } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SignInResult {
  error: Error | null;
  mfaRequired?: boolean;
  data?: { user: User | null };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mfaRequired: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, fullName: string, role?: 'senior' | 'family_member') => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  enrollMFA: () => Promise<AuthMFAEnrollResponse>;
  verifyMFA: (factorId: string, code: string) => Promise<{ error: Error | null }>;
  unenrollMFA: (factorId: string) => Promise<{ error: Error | null }>;
  listFactors: () => Promise<{ totp: Factor[]; error: Error | null }>;
  verifyMFAChallenge: (factorId: string, code: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error, data: undefined };
    }

    // Check if MFA is required
    const { data: assuranceLevel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (assuranceLevel?.nextLevel === 'aal2' && assuranceLevel?.currentLevel === 'aal1') {
      setMfaRequired(true);
      return { error: null, mfaRequired: true, data: { user: data.user } };
    }
    
    setMfaRequired(false);
    return { error: null, mfaRequired: false, data: { user: data.user } };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'senior' | 'family_member' = 'senior') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, role }
      }
    });
    return { error };
  };

  // ─── Auth téléphone (seniors) ───────────────────────────
  const signInWithPhone = async (phone: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  };

  const verifyPhoneOtp = async (phone: string, code: string): Promise<{ error: Error | null; user: User | null }> => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    return { error, user: data?.user ?? null };
  };

  const signOut = async () => {
    setMfaRequired(false);
    await supabase.auth.signOut();
  };

  const enrollMFA = async () => {
    return await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Oscar TOTP'
    });
  };

  const verifyMFA = async (factorId: string, code: string) => {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) return { error: challengeError };

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code
    });
    return { error };
  };

  const verifyMFAChallenge = async (factorId: string, code: string) => {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) return { error: challengeError };

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code
    });

    if (!error) {
      setMfaRequired(false);
    }
    return { error };
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    return { error };
  };

  const listFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { 
      totp: data?.totp || [], 
      error 
    };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      mfaRequired,
      signIn,
      signUp,
      signInWithPhone,
      verifyPhoneOtp,
      signOut,
      enrollMFA,
      verifyMFA,
      unenrollMFA,
      listFactors,
      verifyMFAChallenge
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
