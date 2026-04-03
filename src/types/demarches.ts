/** Status of a saved document */
export type DocumentStatus = "brouillon" | "copie" | "ouvert_email" | "sauvegarde";

/** A question in a démarche template form */
export interface DemarcheQuestion {
  key: string;
  label: string;
  type: "text" | "textarea" | "date";
  placeholder?: string;
}

/** A démarche template definition */
export interface DemarcheTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  questions: DemarcheQuestion[];
  promptTemplate: string;
}

/** Field values filled by the user for a démarche */
export type DemarcheFields = Record<string, string>;

/** A saved document record (mirrors Xano schema) */
export interface SavedDocument {
  id: string;
  senior_id: string;
  type: string;
  content: string;
  subject: string;
  recipient: string;
  created_at: string;
  status: DocumentStatus;
}

/** Data for the DemarcheCard displayed in chat */
export interface DemarcheCardData {
  templateId: string;
  label: string;
  recipient: string;
  generatedText: string;
  subject: string;
  status: DocumentStatus;
}
