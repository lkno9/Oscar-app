import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Copy, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Accès Famille</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick access to messages */}
        {linkedFamily.length > 0 && (
          <Link to="/family/messages">
            <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Messages famille</p>
                  <p className="text-sm text-muted-foreground">Discuter avec vos proches</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Inviter un membre de la famille
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Créez un code d'invitation pour permettre à un proche de suivre votre bien-être.
            </p>

            <div className="space-y-2">
              <Label>Relation</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enfant">Enfant</SelectItem>
                  <SelectItem value="conjoint">Conjoint(e)</SelectItem>
                  <SelectItem value="petit-enfant">Petit-enfant</SelectItem>
                  <SelectItem value="frère/soeur">Frère/Sœur</SelectItem>
                  <SelectItem value="ami">Ami(e)</SelectItem>
                  <SelectItem value="aidant">Aidant(e)</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateInvitation}
              disabled={creatingInvitation}
              className="w-full"
            >
              {creatingInvitation ? 'Création...' : 'Créer un code d\'invitation'}
            </Button>

            {generatedCode && (
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Partagez ce code avec votre proche :
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                    {generatedCode}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => copyCode(generatedCode)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ce code est valable jusqu'à son utilisation
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invitations en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <Badge variant="outline">{invitation.relationship}</Badge>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm">{invitation.invitation_code}</span>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveLink(invitation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Linked Family Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Famille connectée
            </CardTitle>
          </CardHeader>
          <CardContent>
            {linkedFamily.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun membre de la famille connecté
              </p>
            ) : (
              <div className="space-y-3">
                {linkedFamily.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={link.family_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {link.family_profile?.full_name?.charAt(0).toUpperCase() || 'F'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {link.family_profile?.full_name || 'Membre famille'}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {link.relationship}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/family/messages?contact=${link.family_member_id}`}>
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
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
