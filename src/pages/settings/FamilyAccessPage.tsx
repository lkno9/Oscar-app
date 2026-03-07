import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Copy, Trash2, MessageCircle, Share2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';

export default function FamilyAccessPage() {
  const { linkedFamily, pendingInvitations, loading, createInvitation, removeLink } = useFamilyLinks();
  const [relationship, setRelationship] = useState('enfant');
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleCreateInvitation = async () => {
    setCreatingInvitation(true);
    const { invitationCode, error } = await createInvitation(relationship);
    setCreatingInvitation(false);

    if (error) {
      toast.error('Erreur lors de la création de l\'invitation');
    } else if (invitationCode) {
      setGeneratedCode(invitationCode);
      toast.success('Code d\'invitation créé !');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  const shareCode = (code: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Code Oscar',
        text: `Rejoignez-moi sur Oscar avec le code : ${code}`
      });
    } else {
      copyCode(code);
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    const { error } = await removeLink(linkId);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Accès supprimé');
    }
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
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
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
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Accès Famille</h1>
            {linkedFamily.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {linkedFamily.length} membre{linkedFamily.length > 1 ? 's' : ''} connecté{linkedFamily.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick access to messages */}
        {linkedFamily.length > 0 && (
          <Link to="/family/messages">
            <Card className="bg-gradient-to-r from-primary/10 to-accent border-primary/20 hover:shadow-card transition-all active:scale-[0.98] cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Messages famille</p>
                  <p className="text-sm text-muted-foreground">Discuter avec vos proches</p>
                </div>
                {/* Stacked family avatars */}
                <div className="flex -space-x-2">
                  {linkedFamily.slice(0, 3).map(link => (
                    <Avatar key={link.id} className="w-8 h-8 ring-2 ring-card">
                      <AvatarImage src={link.family_profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                        {link.family_profile?.full_name?.charAt(0) || 'F'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Create Invitation */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-primary" />
              </div>
              Inviter un membre de la famille
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Créez un code d'invitation pour permettre à un proche de suivre votre bien-être.
            </p>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Relation
              </Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
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
              disabled={creatingInvitation}
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
              {creatingInvitation ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Création...
                </>
              ) : (
                "Créer un code d'invitation"
              )}
            </Button>

            {/* Generated Code Display */}
            {generatedCode && (
              <div className="p-5 bg-gradient-to-br from-primary/10 via-accent to-primary/5 rounded-2xl border border-primary/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Partagez ce code avec votre proche :
                </p>
                <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                  <p className="text-3xl font-mono font-black tracking-[0.3em] text-primary select-all">
                    {generatedCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-primary/30"
                    onClick={() => copyCode(generatedCode)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier
                  </Button>
                  <Button
                    className="flex-1 h-11 rounded-xl"
                    onClick={() => shareCode(generatedCode)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ce code est valable jusqu'à son utilisation
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Invitations en attente
                <Badge variant="secondary" className="text-[10px]">
                  {pendingInvitations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <Badge variant="outline" className="text-[10px]">
                            {invitation.relationship}
                          </Badge>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-sm font-bold tracking-wider">
                              {invitation.invitation_code}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCode(invitation.invitation_code!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => handleRemoveLink(invitation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Linked Family Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Famille connectée
            </CardTitle>
          </CardHeader>
          <CardContent>
            {linkedFamily.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium mb-1">Aucun membre connecté</p>
                <p className="text-xs text-muted-foreground">
                  Créez un code d'invitation ci-dessus
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedFamily.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={link.family_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {link.family_profile?.full_name?.charAt(0).toUpperCase() || 'F'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {link.family_profile?.full_name || 'Membre famille'}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {link.relationship}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link to={`/family/messages?contact=${link.family_member_id}`}>
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full h-9 w-9">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retirer cet accès ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette personne ne pourra plus voir vos informations de bien-être ni vous envoyer de messages.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveLink(link.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Retirer l'accès
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
