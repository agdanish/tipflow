import { SmartSuggestions } from '../../components/SmartSuggestions';

interface InsightBarProps {
  onNavigate: (tab: string) => void;
  tipCount: number;
}

export function InsightBar({ onNavigate, tipCount }: InsightBarProps) {
  return (
    <div className="mb-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
      <SmartSuggestions onNavigate={onNavigate} tipCount={tipCount} />
    </div>
  );
}
