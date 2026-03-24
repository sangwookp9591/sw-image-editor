export default function EditorLoading() {
  return (
    <div className="flex h-screen w-screen animate-pulse">
      {/* Left tool sidebar skeleton */}
      <div className="w-14 border-r bg-muted flex flex-col items-center py-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-9 rounded-md bg-muted-foreground/20" />
        ))}
      </div>

      {/* Center canvas area skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar skeleton */}
        <div className="h-12 border-b bg-muted flex items-center px-4 gap-4">
          <div className="h-6 w-6 rounded bg-muted-foreground/20" />
          <div className="h-4 w-32 rounded bg-muted-foreground/20" />
          <div className="flex-1" />
          <div className="h-6 w-6 rounded bg-muted-foreground/20" />
          <div className="h-6 w-6 rounded bg-muted-foreground/20" />
        </div>
        <div className="flex-1 bg-neutral-900" />
      </div>

      {/* Right properties panel skeleton */}
      <div className="w-72 border-l bg-muted p-4">
        <div className="h-4 w-24 rounded bg-muted-foreground/20 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted-foreground/20" />
          ))}
        </div>
      </div>
    </div>
  );
}
