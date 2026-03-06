import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";

/**
 * Hook for smart back navigation
 * - If there's browser history, go back
 * - Otherwise, navigate to the appropriate fallback with tab state
 */
export function useBackNavigation(fallbackPath?: string) {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = useCallback(() => {
    // Determine the appropriate fallback based on current path
    const determineFallback = (): { path: string; state?: { tab?: string } } => {
      if (fallbackPath) return { path: fallbackPath };

      const path = location.pathname;

      // Games subpages -> go to games list
      if (path.startsWith("/services/games/")) {
        return { path: "/services/games" };
      }

      // Service pages -> go to main page with services tab active
      if (path.startsWith("/services/")) {
        return { path: "/", state: { tab: "services" } };
      }

      // Settings subpages -> go to settings
      if (path.startsWith("/settings/")) {
        return { path: "/settings" };
      }

      // Family pages -> go to family dashboard
      if (path.startsWith("/family/")) {
        return { path: "/family" };
      }

      // Settings -> go to main page with services tab
      if (path === "/settings") {
        return { path: "/", state: { tab: "services" } };
      }

      // Default to home
      return { path: "/" };
    };

    // Always use deterministic fallback for predictable navigation
    const fallback = determineFallback();
    navigate(fallback.path, { replace: true, state: fallback.state });
  }, [navigate, location.pathname, fallbackPath]);

  return goBack;
}
