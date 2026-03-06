interface StatusBadgeProps {
  status: "disconnected" | "connecting" | "connected";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    disconnected: {
      color: "bg-muted-foreground",
      text: "Disconnected",
    },
    connecting: {
      color: "bg-warning animate-pulse",
      text: "Connecting...",
    },
    connected: {
      color: "bg-success",
      text: "Connected",
    },
  };

  const { color, text } = config[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border border-border">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-muted-foreground">{text}</span>
    </div>
  );
}
