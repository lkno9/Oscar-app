import { SOSButton } from "@/components/SOSButton";
import { HelpButton } from "@/components/HelpDrawer";

export function SubPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background shadow-lg relative">
      {/* Global Help button – fixed top-right */}
      <div className="fixed top-3 right-3 z-30">
        <HelpButton />
      </div>

      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <SOSButton />
    </div>
  );
}
