import { useEffect, useRef } from "react";
import { Wrench, CheckCircle, Loader2, AlertCircle } from "lucide-react";

export interface ToolCall {
  id: string;
  name: string;
  status: "pending" | "success" | "error";
  timestamp: Date;
  result?: string;
}

interface ToolCallLogProps {
  toolCalls: ToolCall[];
}

export function ToolCallLog({ toolCalls }: ToolCallLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [toolCalls]);

  const getStatusIcon = (status: ToolCall["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="w-3 h-3 animate-spin text-warning" />;
      case "success":
        return <CheckCircle className="w-3 h-3 text-success" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-destructive" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Wrench className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Tool Calls</h2>
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {toolCalls.length} calls
        </span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs"
      >
        {toolCalls.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              No tool calls yet...
            </p>
          </div>
        ) : (
          toolCalls.map((call) => (
            <div
              key={call.id}
              className="bg-secondary/50 rounded-md p-3 border border-border animate-fade-in"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(call.status)}
                <span className="text-primary font-medium">{call.name}</span>
                <span className="ml-auto text-muted-foreground">
                  {call.timestamp.toLocaleTimeString()}
                </span>
              </div>
              {call.result && (
                <p className="mt-2 text-muted-foreground pl-5 border-l-2 border-border">
                  {call.result}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
