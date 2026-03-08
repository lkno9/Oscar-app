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
    if (!invitationCode.trim()) { toast.error('Veuillez entrer un code d\'invitation'); return; }
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
      <div className="min-h-screen bg-stone-50 pb-24">
        <div className="bg-white/80 px-5 py-4 border-b border-stone-100"><Skeleton className="h-6 w-32" /></div>
        <div className="p-5 space-y-6"><Skeleton className="h-56 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/family">
            <Button variant="ghost" size="icon" className="rounded-full text-stone-500 hover:bg-stone-100 h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-lg font-bold text-stone-800">Paramètres</h1>
        </div>
      </header>

      <main className="p-5 space-y-6">
        {/* Invitation Code */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">Rejoindre un proche</h2>
              <p className="text-xs text-stone-400">Entrez le code de votre proche</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="invitation-code" className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Code d'invitation</Label>
              <Input
                id="invitation-code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4"
                maxLength={8}
                className="font-mono text-2xl tracking-[0.4em] uppercase text-center h-14 rounded-xl border-stone-200 bg-stone-50 focus:bg-white mt-2"
              />
              <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < invitationCode.length ? 'bg-primary scale-110' : 'bg-stone-200'}`} />
                ))}
              </div>
            </div>

            <Button onClick={handleAcceptInvitation} disabled={submitting || invitationCode.length < 8} className="w-full h-12 rounded-xl text-base font-semibold">
              {submitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Validation...</>) : 'Valider le code'}
            </Button>
          </div>
        </div>

        {/* Linked Seniors */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="font-bold text-stone-800">Mes proches liés</h2>
          </div>

          {linkedSeniors.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm text-stone-400">Aucun proche lié pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedSeniors.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11 border-2 border-white shadow-sm">
                      <AvatarImage src={link.senior_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{link.senior_profile?.full_name?.charAt(0).toUpperCase() || 'S'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{link.senior_profile?.full_name || 'Mon proche'}</p>
                      <Badge variant="secondary" className="text-[10px] mt-0.5 bg-stone-200/50 text-stone-500">{link.relationship}</Badge>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full h-9 w-9"><Trash2 className="w-4 h-4" /></Button>
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

        {/* Sign Out */}
        <button onClick={() => signOut()} className="w-full py-3.5 rounded-xl text-sm font-semibold text-red-500 bg-white border border-red-100 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </main>
    </div>
  );
}
