import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Copy, Trash2, MessageCircle, Share2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { toast } from 'sonner';

export default function FamilyAccessPage() {
  const { linkedFamily, pendingInvitations, loading, createInvitation, removeLink, canCreateInvitation, MAX_FAMILY_PER_SENIOR } = useFamilyLinks();
  const [relationship, setRelationship] = useState('enfant');
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleCreateInvitation = async () => {
    setCreatingInvitation(true);
    const { invitationCode, error } = await createInvitation(relationship);
    setCreatingInvitation(false);
    if (error) toast.error("Erreur lors de la création de l'invitation");
    else if (invitationCode) { setGeneratedCode(invitationCode); toast.success("Code d'invitation créé !"); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success('Code copié !'); };
  const shareCode = (code: string) => {
    if (navigator.share) navigator.share({ title: 'Code Oscar', text: `Rejoignez-moi sur Oscar avec le code : ${code}` });
    else copyCode(code);
  };

  const handleRemoveLink = async (linkId: string) => {
    const { error } = await removeLink(linkId);
    if (error) toast.error('Erreur lors de la suppression');
    else toast.success('Accès supprimé');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card px-4 py-4 border-b border-border"><Skeleton className="h-6 w-32" /></div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 sticky top-0 z-10">
        <Link to="/settings">
          <button className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Accès Famille</h1>
          {linkedFamily.length > 0 && (
            <p className="text-xs text-muted-foreground">{linkedFamily.length} membre{linkedFamily.length > 1 ? 's' : ''} connecté{linkedFamily.length > 1 ? 's' : ''}</p>
          )}
        </div>
        <Users className="w-6 h-6 text-primary" />
      </header>

      <main className="p-4 space-y-4">
        {/* Messages famille (si liés) */}
        {linkedFamily.length > 0 && (
          <Link to="/family/messages">
            <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Messages famille</p>
                <p className="text-xs text-muted-foreground">Discuter avec vos proches</p>
              </div>
              <div className="flex -space-x-2">
                {linkedFamily.slice(0, 3).map(link => (
                  <Avatar key={link.id} className="w-8 h-8 border-2 border-card">
                    <AvatarImage src={link.family_profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{link.family_profile?.full_name?.charAt(0) || 'F'}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </Link>
        )}

        {/* Inviter un proche */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground">Inviter un proche</h2>
              <p className="text-sm text-muted-foreground">Créez un code à partager</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Relation</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger className="h-12 rounded-xl mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enfant">Enfant</SelectItem>
                  <SelectItem value="conjoint">Conjoint(e)</SelectItem>
                  <SelectItem value="petit-enfant">Petit-enfant</SelectItem>
                  <SelectItem value="frère/soeur">Frère/Soeur</SelectItem>
                  <SelectItem value="ami">Ami(e)</SelectItem>
                  <SelectItem value="aidant">Aidant(e)</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateInvitation}
              disabled={creatingInvitation || !canCreateInvitation}
              className="w-full gap-2 min-h-[52px]"
              size="lg"
            >
              {creatingInvitation
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Création...</>
                : "Créer un code d'invitation"
              }
            </Button>

            {!canCreateInvitation && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2 border border-amber-200 dark:border-amber-800">
                Limite de {MAX_FAMILY_PER_SENIOR} membres famille atteinte
              </p>
            )}

            {canCreateInvitation && (linkedFamily.length + pendingInvitations.length) > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {linkedFamily.length + pendingInvitations.length}/{MAX_FAMILY_PER_SENIOR} places utilisées
              </p>
            )}

            {generatedCode && (
              <div className="bg-accent rounded-xl p-5 border border-primary/20 text-center space-y-3">
                <div className="text-3xl">🎉</div>
                <p className="text-sm font-medium text-foreground">Partagez ce code avec votre proche :</p>
                <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                  <p className="text-3xl font-mono font-black tracking-[0.3em] text-primary select-all">{generatedCode}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => copyCode(generatedCode)}>
                    <Copy className="w-4 h-4 mr-2" />Copier
                  </Button>
                  <Button className="flex-1 h-11 rounded-xl" onClick={() => shareCode(generatedCode)}>
                    <Share2 className="w-4 h-4 mr-2" />Partager
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Valable jusqu'à son utilisation</p>
              </div>
            )}
          </div>
        </div>

        {/* Invitations en attente */}
        {pendingInvitations.length > 0 && (
          <div className="bg-card rounded-xl p-5 border border-border">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              En attente
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">{pendingInvitations.length}</span>
            </h2>
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="text-[10px]">{inv.relationship}</Badge>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-xs font-bold tracking-wider text-foreground">{inv.invitation_code}</span>
                        <button onClick={() => copyCode(inv.invitation_code!)} className="text-muted-foreground hover:text-foreground p-0.5">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8" onClick={() => handleRemoveLink(inv.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Famille connectée */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground">Famille connectée</h2>
              <p className="text-sm text-muted-foreground">{linkedFamily.length} membre{linkedFamily.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          {linkedFamily.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">👨‍👩‍👧</div>
              <p className="text-sm font-medium text-foreground mb-1">Aucun membre connecté</p>
              <p className="text-xs text-muted-foreground">Créez un code d'invitation ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedFamily.map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={link.family_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{link.family_profile?.full_name?.charAt(0).toUpperCase() || 'F'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{link.family_profile?.full_name || 'Membre famille'}</p>
                    <Badge variant="secondary" className="text-[10px]">{link.relationship}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link to={`/family/messages?contact=${link.family_member_id}`}>
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-primary hover:bg-primary/10">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 w-9">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Retirer cet accès ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette personne ne pourra plus voir vos informations de bien-être ni vous envoyer de messages.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveLink(link.id)} className="bg-destructive text-destructive-foreground">Retirer l'accès</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
