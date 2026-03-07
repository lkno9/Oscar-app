import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/family">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Paramètres</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Add Senior by Invitation Code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Rejoindre un proche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Demandez à votre proche de vous communiquer son code d'invitation depuis l'application Oscar.
            </p>
            <div className="space-y-2">
              <Label htmlFor="invitation-code">Code d'invitation</Label>
              <div className="flex gap-2">
                <Input
                  id="invitation-code"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  placeholder="Ex: A1B2C3D4"
                  maxLength={8}
                  className="font-mono text-lg tracking-widest uppercase"
                />
                <Button onClick={handleAcceptInvitation} disabled={submitting}>
                  {submitting ? 'Envoi...' : 'Valider'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Seniors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Mes proches liés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {linkedSeniors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun proche lié pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {linkedSeniors.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={link.senior_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {link.senior_profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {link.senior_profile?.full_name || 'Mon proche'}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {link.relationship}
                        </Badge>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
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
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/50"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </Button>
      </main>
    </div>
  );
}
