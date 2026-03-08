/**
 * CallScreen — Wrapper pour la migration vers LiveKit Agents
 *
 * Ce fichier conserve l'interface CallScreenProps utilisée par HomePage et CommunicationPage,
 * mais délègue tout le rendu à VideoCallOscar (LiveKit).
 *
 * L'ancien code Tavus a été supprimé.
 */

import { VideoCallOscar } from "@/components/VideoCallOscar";

// ─── Types ────────────────────────────────────────────────
interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoEnabled?: boolean;
}

// ─── Main Component ───────────────────────────────────────
export function CallScreen({ isOpen, onClose, initialVideoEnabled = false }: CallScreenProps) {
  return (
    <VideoCallOscar
      isOpen={isOpen}
      onClose={onClose}
      initialVideoEnabled={initialVideoEnabled}
    />
  );
}
