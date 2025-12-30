import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";

/**
 * Hook for smart back navigation
 * - If there's browser history, go back
 * - Otherwise, navigate to a fallback route based on current location
 */
export function useBackNavigation(fallbackPath?: string) {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = useCallback(() => {
    // Determine the appropriate fallback based on current path
    const determineFallback = (): string => {
      if (fallbackPath) return fallbackPath;
      
      const path = location.pathname;
      
      // Service pages -> go to services
      if (path.startsWith("/services/")) {
        // Games subpages -> go to games
        if (path.startsWith("/services/games/")) {
          return "/services/games";
        }
        return "/services";
      }
      
      // Family pages -> go to family dashboard
      if (path.startsWith("/family/")) {
        return "/family";
      }
      
      // Settings subpages -> go to settings
      if (path.startsWith("/settings/")) {
        return "/settings";
      }
      
      // Default to home
      return "/";
    };

    // Check if we have meaningful history to go back to
    // window.history.length > 2 means there's real history (1 is the initial page, 2 includes current)
    if (window.history.length > 2 && document.referrer) {
      navigate(-1);
    } else {
      navigate(determineFallback(), { replace: true });
    }
  }, [navigate, location.pathname, fallbackPath]);

  return goBack;
}
