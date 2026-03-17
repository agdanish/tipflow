import type { AddressTag as AddressTagType } from '../types';

interface AddressTagProps {
  tag: AddressTagType;
  size?: 'sm' | 'md';
}

/**
 * AddressTag — a small colored pill that displays a custom label for an address.
 * Used in TipHistory, Leaderboard, and other places where addresses are shown.
 */
export function AddressTag({ tag, size = 'sm' }: AddressTagProps) {
  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium leading-none whitespace-nowrap ${sizeClasses}`}
      style={{
        backgroundColor: `${tag.color || '#10b981'}20`,
        color: tag.color || '#10b981',
        border: `1px solid ${tag.color || '#10b981'}40`,
      }}
      title={`Tagged: ${tag.label} (${tag.address})`}
    >
      {tag.label}
    </span>
  );
}
