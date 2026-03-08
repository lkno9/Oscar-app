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
  const { linkedFamily, pendingInvitations, loading, createInvitation, removeLink } = useFamilyLinks();
  const [relationship, setRelationship] = useState('enfant');
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleCreateInvitation = async () => {
    setCreatingInvitation(true);
    const { invitationCode, error } = await createInvitation(relationship);
    setCreatingInvitation(false);
    if (error) toast.error('Erreur lors de la création de l\'invitation');
    else if (invitationCode) { setGeneratedCode(invitationCode); toast.success('Code d\'invitation créé !'); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success('Code copié !'); };
  const shareCode = (code: string) => { if (navigator.share) navigator.share({ title: 'Code Oscar', text: `Rejoignez-moi sur Oscar avec le code : ${code}` }); else copyCode(code); };

  const handleRemoveLink = async (linkId: string) => {
    const { error } = await removeLink(linkId);
    if (error) toast.error('Erreur lors de la suppression');
    else toast.success('Accès supprimé');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 pb-24">
        <div className="bg-white/80 px-5 py-4 border-b border-stone-100"><Skeleton className="h-6 w-32" /></div>
        <div className="p-5 space-y-6"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="rounded-full text-stone-500 hover:bg-stone-100 h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-800">Accès Famille</h1>
            {linkedFamily.length > 0 && <p className="text-[11px] text-stone-400">{linkedFamily.length} membre{linkedFamily.length > 1 ? 's' : ''} connecté{linkedFamily.length > 1 ? 's' : ''}</p>}
          </div>
        </div>
      </header>

      <main className="p-5 space-y-5">
        {/* Quick Messages Link */}
        {linkedFamily.length > 0 && (
          <Link to="/family/messages">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform border border-blue-100/60">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-stone-800 text-sm">Messages famille</p>
                <p className="text-xs text-stone-400">Discuter avec vos proches</p>
              </div>
              <div className="flex -space-x-2">
                {linkedFamily.slice(0, 3).map(link => (
                  <Avatar key={link.id} className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={link.family_profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{link.family_profile?.full_name?.charAt(0) || 'F'}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </Link>
        )}

        {/* Create Invitation */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">Inviter un proche</h2>
              <p className="text-xs text-stone-400">Créez un code à partager</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Relation</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger className="h-12 rounded-xl border-stone-200 mt-2"><SelectValue /></SelectTrigger>
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

            <Button onClick={handleCreateInvitation} disabled={creatingInvitation} className="w-full h-12 rounded-xl text-base font-semibold">
              {creatingInvitation ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Création...</>) : "Créer un code d'invitation"}
            </Button>

            {generatedCode && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100/60 text-center space-y-3 mt-2">
                <div className="text-3xl mb-1">🎉</div>
                <p className="text-sm font-medium text-stone-700">Partagez ce code avec votre proche :</p>
                <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                  <p className="text-3xl font-mono font-black tracking-[0.3em] text-primary select-all">{generatedCode}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-11 rounded-xl border-stone-200 text-stone-600" onClick={() => copyCode(generatedCode)}>
                    <Copy className="w-4 h-4 mr-2" />Copier
                  </Button>
                  <Button className="flex-1 h-11 rounded-xl" onClick={() => shareCode(generatedCode)}>
                    <Share2 className="w-4 h-4 mr-2" />Partager
                  </Button>
                </div>
                <p className="text-[11px] text-stone-400">Valable jusqu'à son utilisation</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              En attente
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">{pendingInvitations.length}</span>
            </h2>
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="text-[10px] bg-amber-100/50 text-amber-700">{inv.relationship}</Badge>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-xs font-bold tracking-wider text-stone-700">{inv.invitation_code}</span>
                        <button onClick={() => copyCode(inv.invitation_code!)} className="text-stone-400 hover:text-stone-600 p-0.5"><Copy className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full h-8 w-8" onClick={() => handleRemoveLink(inv.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Family */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="font-bold text-stone-800">Famille connectée</h2>
          </div>

          {linkedFamily.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">👨‍👩‍👧</div>
              <p className="text-sm font-medium text-stone-600 mb-1">Aucun membre connecté</p>
              <p className="text-xs text-stone-400">Créez un code d'invitation ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedFamily.map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
                  <Avatar className="w-11 h-11 border-2 border-white shadow-sm">
                    <AvatarImage src={link.family_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{link.family_profile?.full_name?.charAt(0).toUpperCase() || 'F'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm truncate">{link.family_profile?.full_name || 'Membre famille'}</p>
                    <Badge variant="secondary" className="text-[10px] bg-stone-200/50 text-stone-500">{link.relationship}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link to={`/family/messages?contact=${link.family_member_id}`}>
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-blue-500 hover:bg-blue-50"><MessageCircle className="w-4 h-4" /></Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full h-9 w-9"><Trash2 className="w-4 h-4" /></Button>
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
