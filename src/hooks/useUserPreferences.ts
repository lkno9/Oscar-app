/**
 * Lit les préférences utilisateur sauvegardées lors de l'onboarding
 * et expose des helpers pour adapter l'UI au profil senior.
 */

export interface UserPreferences {
  techLevel: "beginner" | "intermediate" | "advanced";
  interests: string[];
  contactTime: "morning" | "afternoon" | "evening";
}

const DEFAULTS: UserPreferences = {
  techLevel: "beginner",
  interests: [],
  contactTime: "morning",
};

export function useUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem("oscar_onboarding");
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      techLevel: parsed.techLevel ?? DEFAULTS.techLevel,
      interests: parsed.interests ?? DEFAULTS.interests,
      contactTime: parsed.contactTime ?? DEFAULTS.contactTime,
    };
  } catch {
    return DEFAULTS;
  }
}

/** Renvoie true si l'utilisateur est débutant */
export function useIsBeginner(): boolean {
  const { techLevel } = useUserPreferences();
  return techLevel === "beginner";
}
