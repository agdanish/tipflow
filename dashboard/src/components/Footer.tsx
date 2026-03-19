export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800/40 bg-zinc-950/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>TipFlow v1.0 — Powered by Tether WDK</span>
          </div>
          <div className="flex items-center gap-4">
            <span>43 services</span>
            <span>&middot;</span>
            <span>230+ endpoints</span>
            <span>&middot;</span>
            <span>Apache 2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
