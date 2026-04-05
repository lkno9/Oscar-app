import { jsPDF } from "jspdf";
import type { DemarcheTemplate, DemarcheFields } from "@/types/demarches";

// ─── Templates ──────────────────────────────────────────────

export const DEMARCHE_TEMPLATES: DemarcheTemplate[] = [
  {
    id: "reclamation",
    label: "Lettre de réclamation",
    icon: "FileWarning",
    description: "Pour signaler un problème ou demander un remboursement",
    questions: [
      {
        key: "destinataire",
        label: "À qui adressez-vous cette lettre ?",
        type: "text",
        placeholder: "Ex : Ma banque, Mon opérateur...",
      },
      {
        key: "objet",
        label: "Quel est le problème ?",
        type: "textarea",
        placeholder: "Décrivez brièvement le souci rencontré",
      },
      {
        key: "date_incident",
        label: "Quand cela s'est-il passé ?",
        type: "date",
      },
    ],
    promptTemplate:
      "Rédige une lettre formelle et polie adressée à {destinataire}, concernant : {objet}. L'incident a eu lieu le {date_incident}. Ton formel, première personne du singulier, 500 mots max. Ne mets pas de crochets ni de champs à remplir.",
  },
  {
    id: "courrier-mairie",
    label: "Courrier à la mairie",
    icon: "Building2",
    description: "Pour écrire à votre mairie (demande, signalement...)",
    questions: [
      {
        key: "mairie",
        label: "Quelle est votre mairie ?",
        type: "text",
        placeholder: "Ex : Mairie de Lyon, Mairie du 15e...",
      },
      {
        key: "objet",
        label: "Quel est l'objet de votre courrier ?",
        type: "textarea",
        placeholder: "Ex : Demande de carte d'identité, signalement...",
      },
      {
        key: "details",
        label: "Des précisions à ajouter ?",
        type: "textarea",
        placeholder: "Ajoutez des détails si nécessaire",
      },
    ],
    promptTemplate:
      "Rédige un courrier formel et respectueux adressé à {mairie}, concernant : {objet}. Détails supplémentaires : {details}. Ton formel, première personne du singulier, 500 mots max. Ne mets pas de crochets ni de champs à remplir.",
  },
  {
    id: "resiliation",
    label: "Résiliation d'abonnement",
    icon: "FileX2",
    description: "Pour résilier un contrat ou un abonnement",
    questions: [
      {
        key: "entreprise",
        label: "Quelle entreprise ou quel service ?",
        type: "text",
        placeholder: "Ex : Orange, Canal+, ma salle de sport...",
      },
      {
        key: "type_contrat",
        label: "Quel type d'abonnement ?",
        type: "text",
        placeholder: "Ex : Téléphone, internet, magazine...",
      },
      {
        key: "motif",
        label: "Pourquoi souhaitez-vous résilier ?",
        type: "textarea",
        placeholder: "Ex : Trop cher, je n'en ai plus besoin...",
      },
    ],
    promptTemplate:
      "Rédige une lettre de résiliation formelle et polie adressée à {entreprise} pour résilier un abonnement de type {type_contrat}. Motif : {motif}. Ton formel, première personne du singulier, 400 mots max. Inclure une demande de confirmation de résiliation. Ne mets pas de crochets ni de champs à remplir.",
  },
  {
    id: "aide-sociale",
    label: "Demande d'aide sociale",
    icon: "Heart",
    description: "Pour demander une aide ou une prestation sociale",
    questions: [
      {
        key: "organisme",
        label: "À quel organisme écrivez-vous ?",
        type: "text",
        placeholder: "Ex : CAF, CPAM, MDPH...",
      },
      {
        key: "aide",
        label: "Quelle aide demandez-vous ?",
        type: "textarea",
        placeholder: "Ex : Allocation logement, APA...",
      },
      {
        key: "situation",
        label: "Décrivez brièvement votre situation",
        type: "textarea",
        placeholder: "Ex : Retraité, vivant seul...",
      },
    ],
    promptTemplate:
      "Rédige une lettre formelle et polie adressée à {organisme} pour demander : {aide}. Situation de la personne : {situation}. Ton formel, première personne du singulier, 500 mots max. Ne mets pas de crochets ni de champs à remplir.",
  },
  {
    id: "caf-cpam",
    label: "Lettre à la CAF / CPAM",
    icon: "ShieldCheck",
    description: "Pour contacter la CAF ou la CPAM",
    questions: [
      {
        key: "organisme",
        label: "CAF ou CPAM ?",
        type: "text",
        placeholder: "Ex : CAF de Paris, CPAM du Rhône...",
      },
      {
        key: "objet",
        label: "Quel est l'objet de votre courrier ?",
        type: "textarea",
        placeholder: "Ex : Changement de situation, réclamation...",
      },
      {
        key: "details",
        label: "Des précisions ?",
        type: "textarea",
        placeholder: "Ajoutez les détails importants",
      },
    ],
    promptTemplate:
      "Rédige un courrier formel et poli adressé à {organisme}, objet : {objet}. Détails : {details}. Ton formel, première personne du singulier, 500 mots max. Ne mets pas de crochets ni de champs à remplir.",
  },
  {
    id: "message-libre",
    label: "Message libre",
    icon: "PenLine",
    description: "Écrire librement un message ou un courrier",
    questions: [
      {
        key: "destinataire",
        label: "À qui écrivez-vous ?",
        type: "text",
        placeholder: "Ex : Mon médecin, ma banque...",
      },
      {
        key: "sujet",
        label: "Quel est le sujet ?",
        type: "text",
        placeholder: "Ex : Prise de rendez-vous, remerciement...",
      },
      {
        key: "contenu",
        label: "Que souhaitez-vous dire ?",
        type: "textarea",
        placeholder: "Décrivez le contenu de votre message",
      },
    ],
    promptTemplate:
      "Rédige un message poli adressé à {destinataire}, sujet : {sujet}. Contenu souhaité : {contenu}. Adapte le ton (formel si professionnel, amical si personnel). 400 mots max. Ne mets pas de crochets ni de champs à remplir.",
  },
];

/**
 * Build the prompt from a template and filled fields.
 */
export function buildPrompt(template: DemarcheTemplate, fields: DemarcheFields): string {
  let prompt = template.promptTemplate;
  for (const [key, value] of Object.entries(fields)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value || "(non renseigné)");
  }
  return prompt;
}

/**
 * Get a template by its ID.
 */
export function getTemplateById(id: string): DemarcheTemplate | undefined {
  return DEMARCHE_TEMPLATES.find((t) => t.id === id);
}

// ─── PDF Generation ─────────────────────────────────────────

/**
 * Word-wrap a line of text to fit within a given max width (in characters).
 */
function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    const words = paragraph.split(" ");
    let currentLine = "";

    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxChars) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

/**
 * Format a date string for display in French format.
 */
function formatDateFR(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Options for PDF generation */
export interface DocumentOptions {
  subject?: string;
  recipient?: string;
  senderName?: string;
  senderAddress?: string;
  city?: string;
}

/**
 * Generate a formal PDF letter with proper postal layout.
 * Layout: sender top-left, recipient top-right, city+date, subject, body, signature.
 * Returns a Blob ready for download.
 */
export function generateDocument(
  type: string,
  content: string,
  subject?: string,
  options?: DocumentOptions
): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 25;
  const marginRight = 25;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const charsPerLine = Math.floor(usableWidth / 2.4);
  const rightCol = pageWidth - marginRight;

  let y = 25;

  // ─── Sender (top-left) ───
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(33, 33, 33);

  if (options?.senderName) {
    doc.text(options.senderName, marginLeft, y);
    y += 5;
  }
  if (options?.senderAddress) {
    const addrLines = wrapText(options.senderAddress, 35);
    for (const line of addrLines) {
      doc.text(line, marginLeft, y);
      y += 5;
    }
  }

  // ─── Recipient (top-right) ───
  const recipientName = options?.recipient || subject || "";
  if (recipientName) {
    let ry = 25;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const recipLines = wrapText(recipientName, 35);
    for (const line of recipLines) {
      doc.text(line, rightCol, ry, { align: "right" });
      ry += 5;
    }
    doc.setFont("helvetica", "normal");
  }

  // ─── City + Date ───
  y = Math.max(y, 55);
  const city = options?.city || "";
  const dateStr = formatDateFR(new Date());
  const locationDate = city ? `${city}, le ${dateStr}` : `Le ${dateStr}`;
  doc.setFontSize(11);
  doc.text(locationDate, rightCol, y, { align: "right" });
  y += 12;

  // ─── Subject line ───
  const subjectText = subject || options?.subject;
  if (subjectText) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 30, 53);
    doc.text(`Objet : ${subjectText}`, marginLeft, y);
    y += 10;
  }

  // ─── Body ───
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(33, 33, 33);

  const wrappedLines = wrapText(content, charsPerLine);

  for (const line of wrappedLines) {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = 25;
    }
    doc.text(line, marginLeft, y);
    y += 5.5;
  }

  // ─── Footer — Oscar branding (discreet) ───
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Document créé avec Oscar le ${dateStr}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  // Thin teal line at very bottom
  doc.setDrawColor(30, 184, 154);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, pageHeight - 14, pageWidth - marginRight, pageHeight - 14);

  return doc.output("blob");
}

/**
 * Trigger a PDF download in the browser.
 */
export function downloadDocument(
  type: string,
  content: string,
  subject?: string,
  filename?: string,
  options?: DocumentOptions
): void {
  const blob = generateDocument(type, content, subject, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `oscar-${type}-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
