import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  muted: boolean;
  onToggle: () => void;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ muted, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute exam sound effects' : 'Mute exam sound effects'}
      title={muted ? 'Sound effects muted — click to unmute' : 'Sound effects on — click to mute'}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 ${
        muted
          ? 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
          : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
      }`}
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-600" />}
      <span>{muted ? 'Muted' : 'Sound On'}</span>
    </button>
  );
};
