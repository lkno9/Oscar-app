import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 🔓 DEV SKIP — en mode développement, on bypasse toute l'auth
  if (import.meta.env.DEV) {
    return <>{children}</>;
  }

  const { user, loading, mfaRequired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Block access if MFA verification is pending (aal1 but needs aal2)
  if (mfaRequired) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
