import { useState, useCallback, useRef } from "react";
import { detectDemarcheIntent } from "@/lib/demarcheIntentDetection";
import { getTemplateById, buildPrompt, DEMARCHE_TEMPLATES } from "@/lib/documentService";
import type { DemarcheTemplate, DemarcheFields } from "@/types/demarches";
import type { DemarcheCardData } from "@/types/chat";

export interface DemarcheChatState {
  active: boolean;
  template: DemarcheTemplate | null;
  currentQuestionIndex: number;
  fields: DemarcheFields;
  /** Text generated so far (streamed) */
  generatedText: string;
  isGenerating: boolean;
}

interface UseDemarcheChatOptions {
  /** Called to add an assistant message to the chat */
  addAssistantMessage: (text: string) => void;
  /** Called to add a démarche card to the chat */
  addDemarcheCard: (data: DemarcheCardData) => void;
  /** Called to send a prompt to the orchestrator for text generation */
  sendToOrchestrator: (prompt: string) => void;
}

const CONFIRMATION_MESSAGES: Record<string, string> = {
  reclamation: "Je vais vous aider à écrire une lettre de réclamation. Je vais vous poser quelques questions simples.",
  "courrier-mairie": "Je vais vous aider à écrire un courrier à votre mairie. Répondez à mes questions une par une.",
  resiliation: "Je vais vous aider à résilier votre abonnement. Quelques questions rapides et je rédige tout pour vous.",
  "aide-sociale": "Je vais vous aider à rédiger une demande d'aide sociale. Répondez simplement à mes questions.",
  "caf-cpam": "Je vais vous aider à écrire à la CAF ou à la CPAM. Quelques questions et c'est parti !",
  "message-libre": "Je vais vous aider à écrire votre message. Répondez à quelques questions et je m'occupe du reste.",
};

export function useDemarcheChat({ addAssistantMessage, addDemarcheCard, sendToOrchestrator }: UseDemarcheChatOptions) {
  const stateRef = useRef<DemarcheChatState>({
    active: false,
    template: null,
    currentQuestionIndex: 0,
    fields: {},
    generatedText: "",
    isGenerating: false,
  });

  const [isActive, setIsActive] = useState(false);

  const getState = () => stateRef.current;

  const setState = (updates: Partial<DemarcheChatState>) => {
    stateRef.current = { ...stateRef.current, ...updates };
    setIsActive(stateRef.current.active);
  };

  /**
   * Check if a user message triggers a démarche intent.
   * Returns true if a démarche flow was started (meaning the normal
   * chat flow should NOT process this message).
   */
  const checkIntent = useCallback((userMessage: string): boolean => {
    const state = getState();

    // If we're already in a démarche flow, handle the answer
    if (state.active && state.template && !state.isGenerating) {
      handleAnswer(userMessage);
      return true;
    }

    // Detect intent from user message
    const intent = detectDemarcheIntent(userMessage);
    if (!intent) return false;

    // Start the démarche flow
    const template = DEMARCHE_TEMPLATES.find((t) => t.id === intent.type);
    if (!template) return false;

    setState({
      active: true,
      template,
      currentQuestionIndex: 0,
      fields: {},
      generatedText: "",
      isGenerating: false,
    });

    // Send confirmation + first question
    const confirmation = CONFIRMATION_MESSAGES[intent.type] || "Je vais vous aider avec cette démarche.";
    const firstQuestion = template.questions[0].label;

    addAssistantMessage(`${confirmation}\n\n${firstQuestion}`);

    return true;
  }, [addAssistantMessage]);

  /**
   * Handle a user's answer to a démarche question.
   */
  const handleAnswer = useCallback((answer: string) => {
    const state = getState();
    if (!state.template) return;

    const currentQuestion = state.template.questions[state.currentQuestionIndex];
    const newFields = { ...state.fields, [currentQuestion.key]: answer };

    if (state.currentQuestionIndex < state.template.questions.length - 1) {
      // More questions to ask
      const nextIndex = state.currentQuestionIndex + 1;
      setState({
        fields: newFields,
        currentQuestionIndex: nextIndex,
      });

      const nextQuestion = state.template.questions[nextIndex].label;
      addAssistantMessage(nextQuestion);
    } else {
      // All questions answered — generate the text
      setState({
        fields: newFields,
        isGenerating: true,
        generatedText: "",
      });

      addAssistantMessage("Merci ! Je rédige votre texte...");

      const prompt = buildPrompt(state.template, newFields);
      sendToOrchestrator(prompt);
    }
  }, [addAssistantMessage, sendToOrchestrator]);

  /**
   * Called when text generation is complete.
   * Creates a DemarcheCard in the chat.
   */
  const onGenerationComplete = useCallback((fullText: string) => {
    const state = getState();
    if (!state.active || !state.template) return;

    const recipient = state.fields.destinataire
      || state.fields.entreprise
      || state.fields.mairie
      || state.fields.organisme
      || "";

    const cardData: DemarcheCardData = {
      templateId: state.template.id,
      label: state.template.label,
      recipient,
      generatedText: fullText,
      subject: state.template.label + (recipient ? ` — ${recipient}` : ""),
      status: "brouillon",
    };

    addDemarcheCard(cardData);

    // Reset state
    setState({
      active: false,
      template: null,
      currentQuestionIndex: 0,
      fields: {},
      generatedText: "",
      isGenerating: false,
    });
  }, [addDemarcheCard]);

  /**
   * Cancel the current démarche flow.
   */
  const cancel = useCallback(() => {
    setState({
      active: false,
      template: null,
      currentQuestionIndex: 0,
      fields: {},
      generatedText: "",
      isGenerating: false,
    });
  }, []);

  return {
    isActive,
    isGenerating: stateRef.current.isGenerating,
    checkIntent,
    onGenerationComplete,
    cancel,
  };
}
