import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, MessageCircle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TASK_CATEGORIES } from "./TaskTemplates";

interface TaskStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  due_date: string | null;
  steps: TaskStep[];
  current_step: number;
  created_at: string;
}

interface TaskCardProps {
  task: Task;
  onUpdateStep: (taskId: string, stepId: number, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onAskOscar?: (taskTitle: string) => void;
}

export const TaskCard = ({ task, onUpdateStep, onDelete, onAskOscar }: TaskCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const categoryInfo = TASK_CATEGORIES.find(c => c.value === task.category);
  const completedSteps = task.steps.filter(s => s.completed).length;
  const progress = task.steps.length > 0 ? (completedSteps / task.steps.length) * 100 : 0;
  const isCompleted = progress === 100;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: fr });
  };

  const getStatusColor = () => {
    if (isCompleted) return "text-green-600";
    if (progress > 0) return "text-primary";
    return "text-muted-foreground";
  };

  return (
    <Card className={`transition-all ${isCompleted ? 'bg-green-50/50 border-green-200' : ''}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">
              {categoryInfo?.icon || '📋'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                  )}
                </div>
                
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={getStatusColor()}>
                    {completedSteps}/{task.steps.length} étapes
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {task.due_date && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Échéance : {formatDate(task.due_date)}</span>
                </div>
              )}
            </div>
          </div>
          
          <CollapsibleContent className="mt-4 pt-4 border-t">
            <div className="space-y-3">
              {task.steps.map((step) => (
                <div 
                  key={step.id}
                  className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => onUpdateStep(task.id, step.id, !step.completed)}
                >
                  <div className="mt-0.5">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              {onAskOscar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAskOscar(task.title)}
                  className="text-xs"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Aide d'Oscar
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="text-xs text-destructive hover:text-destructive ml-auto"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Supprimer
              </Button>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
