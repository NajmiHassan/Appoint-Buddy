import { VoiceButton } from "@/components/VoiceButton";
import { SpeakingIndicator } from "@/components/SpeakingIndicator";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { ToolCallLog } from "@/components/ToolCallLog";
import { StatusBadge } from "@/components/StatusBadge";
import { AppointmentCard } from "@/components/AppointmentCard";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { Radio, AlertTriangle } from "lucide-react";

const Index = () => {
  const {
    status,
    isSpeaking,
    messages,
    toolCalls,
    appointment,
    startAgent,
    stopAgent,
    error,
  } = useVoiceAgent();

  const isActive = status === "connected";
  const isConnecting = status === "connecting";

  const handleToggle = () => {
    if (isActive) {
      stopAgent();
    } else {
      startAgent();
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background glow effect */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: isActive 
            ? 'radial-gradient(ellipse at 50% 30%, hsl(186 100% 50% / 0.08) 0%, transparent 50%)'
            : 'none',
          transition: 'background 0.5s ease-out',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Appoint Buddy</h1>
              <p className="text-xs text-muted-foreground">AI Appointment Assistant</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Left panel - Controls */}
          <div className="flex flex-col items-center justify-center gap-8 lg:col-span-1">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {isActive ? "Conversation Active" : "Start Appoint Buddy"}
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                {isActive 
                  ? "Speak naturally. The AI agent is listening and will respond."
                  : "Click the button below to start your voice conversation with the AI agent."
                }
              </p>
            </div>

            <VoiceButton
              isActive={isActive}
              isConnecting={isConnecting}
              onClick={handleToggle}
            />

            <SpeakingIndicator isSpeaking={isSpeaking} />

            {error && (
              <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Appointment card */}
            {appointment && (
              <div className="w-full max-w-sm">
                <AppointmentCard appointment={appointment} />
              </div>
            )}
          </div>

          {/* Middle panel - Transcript */}
          <div className="lg:col-span-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col min-h-[400px]">
            <TranscriptPanel messages={messages} />
          </div>

          {/* Right panel - Tool calls */}
          <div className="lg:col-span-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col min-h-[400px]">
            <ToolCallLog toolCalls={toolCalls} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Powered by ElevenLabs</span>
          <span className="font-mono">Backend: localhost:8000</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
