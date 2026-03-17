const techBadges = [
  { name: 'TypeScript', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  { name: 'React 19', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
  { name: 'Vite 6', color: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  { name: 'Tailwind v4', color: 'bg-sky-500/15 text-sky-400 border-sky-500/25' },
  { name: 'Node.js 22', color: 'bg-green-500/15 text-green-400 border-green-500/25' },
  { name: 'Tether WDK', color: 'bg-teal-500/15 text-teal-400 border-teal-500/25' },
  { name: 'Express 5', color: 'bg-gray-500/15 text-gray-400 border-gray-500/25' },
  { name: 'ethers.js', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25' },
  { name: 'Web Speech API', color: 'bg-rose-500/15 text-rose-400 border-rose-500/25' },
  { name: 'Web Audio API', color: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  { name: 'SSE', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  { name: 'PWA', color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
];

export function TechStack() {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Tech Stack
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {techBadges.map(({ name, color }) => (
          <span
            key={name}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border transition-transform hover:scale-105 ${color}`}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
