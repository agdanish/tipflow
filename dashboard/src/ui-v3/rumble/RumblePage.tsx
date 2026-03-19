import { RumbleIntegration } from '../../components/RumbleIntegration';

export function RumblePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Rumble Creators
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Creator tipping, auto-tips, community pools, and engagement tracking</p>
      </div>
      <RumbleIntegration />
    </div>
  );
}
