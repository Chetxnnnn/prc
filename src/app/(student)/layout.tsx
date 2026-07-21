export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">PRC Tuitions</h1>
        </div>
      </header>
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}
