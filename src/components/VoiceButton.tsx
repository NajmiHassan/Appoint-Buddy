import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceButtonProps {
  isActive: boolean;
  isConnecting: boolean;
  onClick: () => void;
}

export function VoiceButton({ isActive, isConnecting, onClick }: VoiceButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      className={`
        relative group
        w-32 h-32 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out
        ${isActive 
          ? 'bg-primary/20 border-2 border-primary shadow-glow-strong pulse-ring' 
          : 'bg-secondary border-2 border-border hover:border-primary/50 hover:shadow-glow'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {/* Outer glow ring when active */}
      {isActive && (
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
      )}
      
      {/* Icon */}
      <div className={`
        relative z-10 transition-all duration-300
        ${isActive ? 'text-primary text-glow' : 'text-muted-foreground group-hover:text-primary'}
      `}>
        {isConnecting ? (
          <Loader2 className="w-12 h-12 animate-spin" />
        ) : isActive ? (
          <Mic className="w-12 h-12" />
        ) : (
          <MicOff className="w-12 h-12" />
        )}
      </div>
    </button>
  );
}
