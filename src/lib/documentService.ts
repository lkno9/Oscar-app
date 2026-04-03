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

/**
 * Generate a PDF document from the generated text.
 * Returns a Blob ready for download.
 */
export function generateDocument(
  type: string,
  content: string,
  subject?: string
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
  // Approximate chars per line with Georgia-like font at size 13
  const charsPerLine = Math.floor(usableWidth / 2.4);

  let y = 30;

  // Header — Oscar branding (discreet)
  doc.setFontSize(10);
  doc.setTextColor(26, 30, 53); // navy
  doc.text("Oscar", marginLeft, 15);
  doc.setDrawColor(30, 184, 154); // teal
  doc.setLineWidth(0.5);
  doc.line(marginLeft, 18, pageWidth - marginRight, 18);

  // Subject line
  if (subject) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 30, 53);
    doc.text(`Objet : ${subject}`, marginLeft, y);
    y += 12;
  }

  // Body text — serif style, professional
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(33, 33, 33);

  const wrappedLines = wrapText(content, charsPerLine);

  for (const line of wrappedLines) {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 25;
    }
    doc.text(line, marginLeft, y);
    y += 6;
  }

  // Footer
  const footerText = `Document créé avec Oscar le ${formatDateFR(new Date())}`;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(footerText, pageWidth / 2, pageHeight - 12, { align: "center" });

  return doc.output("blob");
}

/**
 * Trigger a PDF download in the browser.
 */
export function downloadDocument(
  type: string,
  content: string,
  subject?: string,
  filename?: string
): void {
  const blob = generateDocument(type, content, subject);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `oscar-${type}-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
