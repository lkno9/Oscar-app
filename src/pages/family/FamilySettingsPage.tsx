import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
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
    if (!invitationCode.trim()) { toast.error("Veuillez entrer un code d'invitation"); return; }
    setSubmitting(true);
    const { error } = await acceptInvitation(invitationCode.trim().toUpperCase());
    setSubmitting(false);
    if (error) { toast.error(error.message); } else { toast.success('Invitation acceptée !'); setInvitationCode(''); }
  };

  const handleRemoveLink = async (linkId: string) => {
    const { error } = await removeLink(linkId);
    if (error) toast.error('Erreur lors de la suppression');
    else toast.success('Lien supprimé');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card px-4 py-4 border-b border-border"><Skeleton className="h-6 w-32" /></div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 sticky top-0 z-10">
        <Link to="/family">
          <button className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </Link>
        <h1 className="text-lg font-bold text-foreground">Paramètres</h1>
      </header>

      <main className="p-4 space-y-4">
        {/* Carte rejoindre un proche */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground">Rejoindre un proche</h2>
              <p className="text-sm text-muted-foreground">Entrez le code de votre proche</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="invitation-code" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code d'invitation</Label>
              <Input
                id="invitation-code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4"
                maxLength={8}
                className="font-mono text-2xl tracking-[0.4em] uppercase text-center h-14 rounded-xl mt-2"
              />
              <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < invitationCode.length ? 'bg-primary scale-110' : 'bg-border'}`} />
                ))}
              </div>
            </div>

            <Button
              onClick={handleAcceptInvitation}
              disabled={submitting || invitationCode.length < 8}
              className="w-full gap-2 min-h-[52px]"
              size="lg"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Validation...</>
              ) : 'Valider le code'}
            </Button>
          </div>
        </div>

        {/* Proches liés */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground">Mes proches liés</h2>
              <p className="text-sm text-muted-foreground">{linkedSeniors.length} proche{linkedSeniors.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          {linkedSeniors.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm text-muted-foreground">Aucun proche lié pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedSeniors.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={link.senior_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{link.senior_profile?.full_name?.charAt(0).toUpperCase() || 'S'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{link.senior_profile?.full_name || 'Mon proche'}</p>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">{link.relationship}</Badge>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 w-9">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce lien ?</AlertDialogTitle>
                        <AlertDialogDescription>Vous ne pourrez plus voir les informations de ce proche ni lui envoyer de messages.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveLink(link.id)} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Déconnexion */}
        <button
          onClick={() => signOut()}
          className="w-full py-4 rounded-xl text-sm font-semibold text-destructive bg-card border border-border hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </main>
    </div>
  );
}
