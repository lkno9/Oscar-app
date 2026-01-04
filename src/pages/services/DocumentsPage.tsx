import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Upload, X, Plus, Calendar, Clock, HelpCircle, MessageCircle, AlertTriangle, Lightbulb, Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useDocuments } from "@/hooks/useDocuments";
import { useAdminTasks } from "@/hooks/useAdminTasks";
import { useFavorites } from "@/hooks/useFavorites";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { TaskCard } from "@/components/documents/TaskCard";
import { AidCard } from "@/components/documents/AidCard";
import { AdminTipCard } from "@/components/documents/AdminTipCard";
import { RightsGuideCard } from "@/components/documents/RightsGuideCard";
import { FavoriteCard } from "@/components/documents/FavoriteCard";
import { ExpirationBadge, getExpirationStatus } from "@/components/documents/ExpirationBadge";
import { DOCUMENT_TYPES, SOCIAL_AIDS, TASK_TEMPLATES, TASK_CATEGORIES, ADMIN_TIPS, RIGHTS_GUIDES } from "@/components/documents/TaskTemplates";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function DocumentsPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const { documents, loading: docsLoading, addDocument, deleteDocument, getExpiringDocuments, getUrgentDocuments } = useDocuments();
  const { tasks, loading: tasksLoading, createTaskFromTemplate, updateTaskStep, deleteTask, getInProgressTasks, templates } = useAdminTasks();
  const { favorites, loading: favsLoading, addFavorite, deleteFavorite, togglePin } = useFavorites();
  
  // Form states
  const [showDocForm, setShowDocForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showFavForm, setShowFavForm] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("autre");
  const [expirationDate, setExpirationDate] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [favTitle, setFavTitle] = useState("");
  const [favContent, setFavContent] = useState("");
  const [favCategory, setFavCategory] = useState("general");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current month tips
  const currentMonth = new Date().getMonth() + 1;
  const relevantTips = useMemo(() => {
    return ADMIN_TIPS.filter(tip => 
      tip.month === currentMonth || tip.season === 'all'
    ).slice(0, 5);
  }, [currentMonth]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!docName) setDocName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    setUploading(true);
    const success = await addDocument(
      docName,
      selectedFile,
      docType,
      expirationDate || null,
      reminderEnabled
    );

    if (success) {
      setDocName("");
      setDocType("autre");
      setExpirationDate("");
      setReminderEnabled(true);
      setSelectedFile(null);
      setShowDocForm(false);
    }
    setUploading(false);
  };

  const handleCreateTask = async (templateId: string) => {
    await createTaskFromTemplate(templateId);
    setShowTaskForm(false);
  };

  const handleAddFavorite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!favTitle) return;

    const success = await addFavorite(favTitle, favContent, favCategory);
    if (success) {
      setFavTitle("");
      setFavContent("");
      setFavCategory("general");
      setShowFavForm(false);
    }
  };

  const handleAskOscar = (context: string) => {
    navigate('/', { state: { oscarMessage: `J'ai besoin d'aide concernant : ${context}` } });
  };

  const urgentDocs = getUrgentDocuments();
  const expiringDocs = getExpiringDocuments(90).filter(d => {
    const status = getExpirationStatus(d.expiration_date);
    return status === 'warning';
  });
  const inProgressTasks = getInProgressTasks();

  // Group documents by expiration month
  const groupedByMonth = () => {
    const docsWithExpiry = documents.filter(d => d.expiration_date);
    const groups: Record<string, typeof documents> = {};
    
    docsWithExpiry.forEach(doc => {
      const month = format(parseISO(doc.expiration_date!), 'MMMM yyyy', { locale: fr });
      if (!groups[month]) groups[month] = [];
      groups[month].push(doc);
    });
    
    return groups;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Documents & Démarches</h1>
          <p className="text-sm text-muted-foreground">Votre assistant administratif</p>
        </div>
        <FileText className="w-6 h-6 text-primary" />
      </header>

      {/* Urgent Alert */}
      {urgentDocs.length > 0 && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive text-sm">
              {urgentDocs.length} document{urgentDocs.length > 1 ? 's' : ''} à renouveler d'urgence
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {urgentDocs.map(d => d.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="accueil" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4 grid grid-cols-6 h-auto p-1">
          <TabsTrigger value="accueil" className="text-xs py-2 px-1">
            <Lightbulb className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs py-2 px-1">
            <FileText className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="echeances" className="text-xs py-2 px-1">
            <Calendar className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="demarches" className="text-xs py-2 px-1">
            <Clock className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="droits" className="text-xs py-2 px-1">
            <BookOpen className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="favoris" className="text-xs py-2 px-1">
            <Star className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        {/* Accueil Tab - Tips & News */}
        <TabsContent value="accueil" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Bienvenue dans votre espace admin</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Oscar vous aide à ne rien oublier et à profiter de tous vos droits.
                </p>
                <Button size="sm" className="mt-3" onClick={() => handleAskOscar("mes démarches administratives à faire")}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Discuter avec Oscar
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{documents.length}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{inProgressTasks.length}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{urgentDocs.length}</p>
                <p className="text-xs text-muted-foreground">Urgents</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Tips */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              À savoir ce mois-ci
            </h3>
            <div className="space-y-3">
              {relevantTips.map(tip => (
                <AdminTipCard key={tip.id} tip={tip} onAskOscar={handleAskOscar} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => handleAskOscar("les aides auxquelles j'ai droit")}>
                <HelpCircle className="w-5 h-5 mb-1" />
                <span className="text-xs">Mes droits</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => handleAskOscar("m'aider à faire ma déclaration d'impôts")}>
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs">Impôts</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => handleAskOscar("comment renouveler ma carte d'identité")}>
                <Clock className="w-5 h-5 mb-1" />
                <span className="text-xs">Papiers</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => handleAskOscar("les aides au logement pour les seniors")}>
                <Star className="w-5 h-5 mb-1" />
                <span className="text-xs">Logement</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {!showDocForm ? (
            <Button className="w-full gap-2" size="lg" onClick={() => setShowDocForm(true)}>
              <Upload className="w-5 h-5" />
              Ajouter un document
            </Button>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Nouveau document</CardTitle>
                  <button type="button" onClick={() => setShowDocForm(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDocument} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="docName">Nom du document *</Label>
                    <Input
                      id="docName"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="Ex: Carte d'identité"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="docType">Type de document</Label>
                    <select
                      id="docType"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {DOCUMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expDate">Date d'expiration (optionnel)</Label>
                    <Input
                      id="expDate"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="reminder"
                      checked={reminderEnabled}
                      onCheckedChange={(checked) => setReminderEnabled(checked === true)}
                    />
                    <Label htmlFor="reminder" className="text-sm font-normal cursor-pointer">
                      Me rappeler avant expiration
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Fichier (optionnel)</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {selectedFile ? selectedFile.name : "Choisir un fichier"}
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? "Envoi en cours..." : "Ajouter le document"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {docsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun document enregistré</p>
              <p className="text-sm">Ajoutez vos premiers documents importants</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={deleteDocument}
                  onAskOscar={handleAskOscar}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Échéances Tab */}
        <TabsContent value="echeances" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {/* Urgent Section */}
          {urgentDocs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                À renouveler d'urgence
              </h3>
              <div className="space-y-2">
                {urgentDocs.map(doc => (
                  <Card key={doc.id} className="bg-destructive/5 border-destructive/20">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <ExpirationBadge expirationDate={doc.expiration_date} size="sm" />
                      </div>
                      <Button size="sm" onClick={() => handleAskOscar(`renouveler ${doc.name}`)}>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Aide
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Warning Section */}
          {expiringDocs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-yellow-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                À renouveler bientôt
              </h3>
              <div className="space-y-2">
                {expiringDocs.map(doc => (
                  <Card key={doc.id} className="bg-yellow-50/50 border-yellow-200">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <ExpirationBadge expirationDate={doc.expiration_date} size="sm" />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleAskOscar(`renouveler ${doc.name}`)}>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Aide
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Calendar by Month */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Toutes les échéances</h3>
            {Object.entries(groupedByMonth()).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune date d'expiration enregistrée
              </p>
            ) : (
              Object.entries(groupedByMonth()).map(([month, docs]) => (
                <div key={month}>
                  <h4 className="text-sm font-medium text-foreground mb-2 capitalize">{month}</h4>
                  <div className="space-y-2">
                    {docs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="text-sm">{doc.name}</span>
                        <ExpirationBadge expirationDate={doc.expiration_date} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Démarches Tab */}
        <TabsContent value="demarches" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {!showTaskForm ? (
            <Button className="w-full gap-2" size="lg" onClick={() => setShowTaskForm(true)}>
              <Plus className="w-5 h-5" />
              Nouvelle démarche
            </Button>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Choisir une démarche</CardTitle>
                  <button type="button" onClick={() => setShowTaskForm(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {TASK_CATEGORIES.map(cat => {
                  const catTemplates = templates.filter(t => t.category === cat.value);
                  if (catTemplates.length === 0) return null;
                  return (
                    <div key={cat.value}>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 sticky top-0 bg-card py-1">
                        <span>{cat.icon}</span> {cat.label}
                      </h4>
                      <div className="space-y-2 mb-4">
                        {catTemplates.map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            className="w-full justify-start h-auto py-3"
                            onClick={() => handleCreateTask(template.id)}
                          >
                            <div className="text-left">
                              <p className="font-medium text-sm">{template.title}</p>
                              <p className="text-xs text-muted-foreground">{template.steps.length} étapes • ~{template.estimatedDays} jours</p>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {tasksLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : inProgressTasks.length === 0 && tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune démarche en cours</p>
              <p className="text-sm">Lancez une nouvelle démarche administrative</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">En cours</h3>
                  {inProgressTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStep={updateTaskStep}
                      onDelete={deleteTask}
                      onAskOscar={handleAskOscar}
                    />
                  ))}
                </div>
              )}
              
              {tasks.filter(t => t.status === 'not_started').length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">À commencer</h3>
                  {tasks.filter(t => t.status === 'not_started').map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStep={updateTaskStep}
                      onDelete={deleteTask}
                      onAskOscar={handleAskOscar}
                    />
                  ))}
                </div>
              )}
              
              {tasks.filter(t => t.status === 'done').length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Terminées</h3>
                  {tasks.filter(t => t.status === 'done').map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStep={updateTaskStep}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Droits Tab - Rights Guides & Aids */}
        <TabsContent value="droits" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          <div className="bg-primary/10 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-foreground flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Comprendre vos droits
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Oscar peut vous aider à comprendre les aides disponibles et vérifier votre éligibilité.
            </p>
            <Button onClick={() => handleAskOscar("les aides sociales auxquelles je peux avoir droit")}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Vérifier mes droits avec Oscar
            </Button>
          </div>

          {/* Detailed Guides */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Guides détaillés</h3>
            <div className="space-y-3">
              {RIGHTS_GUIDES.map(guide => (
                <RightsGuideCard key={guide.id} guide={guide} onAskOscar={handleAskOscar} />
              ))}
            </div>
          </div>

          {/* All Aids List */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Toutes les aides disponibles</h3>
            <div className="space-y-3">
              {SOCIAL_AIDS.map(aid => (
                <AidCard key={aid.id} aid={aid} onAskOscar={handleAskOscar} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Favoris Tab */}
        <TabsContent value="favoris" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {!showFavForm ? (
            <Button className="w-full gap-2" size="lg" onClick={() => setShowFavForm(true)}>
              <Plus className="w-5 h-5" />
              Ajouter un favori
            </Button>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Nouveau favori</CardTitle>
                  <button type="button" onClick={() => setShowFavForm(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFavorite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="favTitle">Titre *</Label>
                    <Input
                      id="favTitle"
                      value={favTitle}
                      onChange={(e) => setFavTitle(e.target.value)}
                      placeholder="Ex: Numéro CAF"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favContent">Note ou lien (optionnel)</Label>
                    <Input
                      id="favContent"
                      value={favContent}
                      onChange={(e) => setFavContent(e.target.value)}
                      placeholder="Ex: 3230 ou https://caf.fr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favCategory">Catégorie</Label>
                    <select
                      id="favCategory"
                      value={favCategory}
                      onChange={(e) => setFavCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="general">Général</option>
                      <option value="aide">Aides sociales</option>
                      <option value="sante">Santé</option>
                      <option value="impots">Impôts</option>
                      <option value="logement">Logement</option>
                      <option value="retraite">Retraite</option>
                      <option value="transport">Transport</option>
                      <option value="lien">Lien utile</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full">
                    Ajouter
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {favsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun favori</p>
              <p className="text-sm">Sauvegardez des informations importantes pour les retrouver facilement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map(fav => (
                <FavoriteCard
                  key={fav.id}
                  favorite={fav}
                  onDelete={deleteFavorite}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
