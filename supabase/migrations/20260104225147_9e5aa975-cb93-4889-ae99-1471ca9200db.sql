-- Add columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS expiration_date date,
ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'autre',
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT true;

-- Create administrative_tasks table
CREATE TABLE public.administrative_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'todo',
  due_date DATE,
  steps JSONB DEFAULT '[]'::jsonb,
  current_step INTEGER DEFAULT 0,
  template_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on administrative_tasks
ALTER TABLE public.administrative_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for administrative_tasks
CREATE POLICY "Users can CRUD own tasks"
ON public.administrative_tasks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Family can view linked seniors tasks
CREATE POLICY "Family can view linked seniors tasks"
ON public.administrative_tasks
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_links
  WHERE family_links.status = 'accepted'
  AND family_links.senior_id = administrative_tasks.user_id
  AND family_links.family_member_id = auth.uid()
));

-- Create document_reminders table
CREATE TABLE public.document_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  reminder_type TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on document_reminders
ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_reminders
CREATE POLICY "Users can CRUD own reminders"
ON public.document_reminders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System can insert reminders (for cron job)
CREATE POLICY "System can insert reminders"
ON public.document_reminders
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at on administrative_tasks
CREATE TRIGGER update_administrative_tasks_updated_at
BEFORE UPDATE ON public.administrative_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for document_reminders
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_reminders;