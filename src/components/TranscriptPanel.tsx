import { useEffect, useRef } from "react";
import { User, Bot } from "lucide-react";

export interface TranscriptMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
}

export function TranscriptPanel({ messages }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse-slow" />
        <h2 className="text-sm font-semibold text-foreground">Live Transcript</h2>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm font-mono">
              Waiting for conversation...
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`
                flex gap-3 animate-fade-in
                ${message.role === 'user' ? 'flex-row-reverse' : ''}
              `}
            >
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${message.role === 'agent' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-secondary text-muted-foreground'
                }
              `}>
                {message.role === 'agent' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              
              <div className={`
                max-w-[80%] rounded-lg px-4 py-2
                ${message.role === 'agent'
                  ? 'bg-card glow-border'
                  : 'bg-secondary'
                }
              `}>
                <p className="text-sm text-foreground">{message.text}</p>
                <span className="text-xs text-muted-foreground font-mono mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
