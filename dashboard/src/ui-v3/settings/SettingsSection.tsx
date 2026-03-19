import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SettingsSectionProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  first?: boolean;
}

export function SettingsSection({ icon: Icon, iconColor, title, subtitle, children, first }: SettingsSectionProps) {
  return (
    <section className={first ? 'mb-8' : 'mb-8 pt-8 border-t border-zinc-800/50'}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {title}
          </h2>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
