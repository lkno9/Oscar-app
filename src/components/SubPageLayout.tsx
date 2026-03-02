export function SubPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background shadow-lg relative">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
