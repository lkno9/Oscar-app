import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function FamilySettingsPage() {
  const { signOut } = useAuth();
  const { linkedSeniors, loading, acceptInvitation, removeLink } = useFamilyLinks();
  const [invitationCode, setInvitationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAcceptInvitation = async () => {
    if (!invitationCode.trim()) {
      toast.error('Veuillez entrer un code d\'invitation');
      return;
    }

    setSubmitting(true);
    const { error } = await acceptInvitation(invitationCode.trim().toUpperCase());
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Invitation acceptée !');
      setInvitationCode('');
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    const { error } = await removeLink(linkId);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Lien supprimé');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-6">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/family">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Paramètres</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Add Senior by Invitation Code */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-primary" />
              </div>
              Rejoindre un proche
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Demandez à votre proche de vous communiquer son code d'invitation.
            </p>

            <div className="space-y-3">
              <Label htmlFor="invitation-code" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Code d'invitation
              </Label>
              <Input
                id="invitation-code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4"
                maxLength={8}
                className="font-mono text-2xl tracking-[0.4em] uppercase text-center h-14 rounded-xl border-2 border-primary/30 focus:border-primary bg-muted/30"
              />
              {/* Progress dots */}
              <div className="flex justify-center gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < invitationCode.length ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleAcceptInvitation}
              disabled={submitting || invitationCode.length < 8}
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Validation...
                </>
              ) : (
                'Valider le code'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Linked Seniors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Mes proches liés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {linkedSeniors.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucun proche lié pour le moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Stacked avatars preview */}
                {linkedSeniors.length >= 2 && (
                  <div className="flex justify-center mb-4">
                    <div className="flex -space-x-2">
                      {linkedSeniors.map(link => (
                        <Avatar key={link.id} className="w-11 h-11 ring-2 ring-card">
                          <AvatarImage src={link.senior_profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {link.senior_profile?.full_name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                )}

                {linkedSeniors.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={link.senior_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {link.senior_profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {link.senior_profile?.full_name || 'Mon proche'}
                        </p>
                        <Badge variant="secondary" className="text-[10px] mt-0.5">
                          {link.relationship}
                        </Badge>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce lien ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Vous ne pourrez plus voir les informations de ce proche ni lui envoyer de messages.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveLink(link.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <div className="mt-8">
          <Separator className="mb-6" />
          <Button
            variant="ghost"
            className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl border border-destructive/20"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </main>
    </div>
  );
}
