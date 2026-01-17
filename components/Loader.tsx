import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
  subText?: string;
}

export const Loader: React.FC<LoaderProps> = ({ text = "Loading...", subText }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 space-y-4 animate-pulse">
      <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
      <h3 className="text-xl font-semibold text-emerald-400">{text}</h3>
      {subText && <p className="text-slate-400 text-sm">{subText}</p>}
    </div>
  );
};
