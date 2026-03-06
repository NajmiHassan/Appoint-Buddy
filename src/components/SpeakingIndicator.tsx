interface SpeakingIndicatorProps {
  isSpeaking: boolean;
}

export function SpeakingIndicator({ isSpeaking }: SpeakingIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 h-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`
              w-1 rounded-full bg-primary transition-all duration-150
              ${isSpeaking ? 'speaking-wave' : 'h-2 opacity-30'}
            `}
            style={{
              height: isSpeaking ? '100%' : '8px',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <span className={`
        text-sm font-medium transition-colors duration-300
        ${isSpeaking ? 'text-primary text-glow' : 'text-muted-foreground'}
      `}>
        {isSpeaking ? 'AI Speaking...' : 'AI Silent'}
      </span>
    </div>
  );
}
