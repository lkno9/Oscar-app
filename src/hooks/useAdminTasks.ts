import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TASK_TEMPLATES, TaskStep } from "@/components/documents/TaskTemplates";
import { Json } from "@/integrations/supabase/types";

interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  due_date: string | null;
  steps: TaskStep[];
  current_step: number;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

const parseSteps = (steps: Json | null): TaskStep[] => {
  if (!steps || !Array.isArray(steps)) return [];
  return steps.map((step: Json) => {
    if (typeof step === 'object' && step !== null && !Array.isArray(step)) {
      return {
        id: Number((step as Record<string, Json>).id) || 0,
        title: String((step as Record<string, Json>).title) || '',
        description: String((step as Record<string, Json>).description) || '',
        completed: Boolean((step as Record<string, Json>).completed)
      };
    }
    return { id: 0, title: '', description: '', completed: false };
  });
};

export const useAdminTasks = () => {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('administrative_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Parse the steps from JSON
      const parsedTasks = (data || []).map(task => ({
        ...task,
        steps: parseSteps(task.steps)
      }));
      
      setTasks(parsedTasks);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les démarches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTaskFromTemplate = async (templateId: string) => {
    if (!user) return false;

    const template = TASK_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      toast({
        title: "Erreur",
        description: "Modèle de démarche introuvable",
        variant: "destructive"
      });
      return false;
    }

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + template.estimatedDays);

      const { error } = await supabase
        .from('administrative_tasks')
        .insert([{
          user_id: user.id,
          title: template.title,
          description: template.description,
          category: template.category,
          status: 'in_progress',
          due_date: dueDate.toISOString().split('T')[0],
          steps: JSON.parse(JSON.stringify(template.steps)),
          current_step: 0,
          template_id: templateId
        }]);

      if (error) throw error;

      toast({
        title: "Démarche créée",
        description: `"${template.title}" a été ajoutée à vos démarches`
      });

      await fetchTasks();
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la démarche",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateTaskStep = async (taskId: string, stepId: number, completed: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSteps = task.steps.map(step => 
      step.id === stepId ? { ...step, completed } : step
    );

    const completedCount = updatedSteps.filter(s => s.completed).length;
    const allCompleted = completedCount === updatedSteps.length;

    try {
      const { error } = await supabase
        .from('administrative_tasks')
        .update({
          steps: JSON.parse(JSON.stringify(updatedSteps)),
          current_step: completedCount,
          status: allCompleted ? 'done' : 'in_progress'
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, steps: updatedSteps, current_step: completedCount, status: allCompleted ? 'done' : 'in_progress' }
          : t
      ));

      if (allCompleted) {
        toast({
          title: "Félicitations ! 🎉",
          description: "Vous avez terminé cette démarche"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'étape",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('administrative_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Démarche supprimée",
        description: "La démarche a été supprimée"
      });

      await fetchTasks();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la démarche",
        variant: "destructive"
      });
    }
  };

  const getInProgressTasks = () => tasks.filter(t => t.status === 'in_progress');
  const getCompletedTasks = () => tasks.filter(t => t.status === 'done');
  const getPendingTasks = () => tasks.filter(t => t.status === 'todo');

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  return {
    tasks,
    loading,
    createTaskFromTemplate,
    updateTaskStep,
    deleteTask,
    fetchTasks,
    getInProgressTasks,
    getCompletedTasks,
    getPendingTasks,
    templates: TASK_TEMPLATES
  };
};
