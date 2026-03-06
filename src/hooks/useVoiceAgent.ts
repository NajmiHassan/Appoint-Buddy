import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import type { TranscriptMessage } from "@/components/TranscriptPanel";
import type { ToolCall } from "@/components/ToolCallLog";
import type { Appointment } from "@/components/AppointmentCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface UseVoiceAgentReturn {
  status: "disconnected" | "connecting" | "connected";
  isSpeaking: boolean;
  messages: TranscriptMessage[];
  toolCalls: ToolCall[];
  appointment: Appointment | null;
  startAgent: () => Promise<void>;
  stopAgent: () => Promise<void>;
  error: string | null;
}

async function callBackendTool(
  toolName: string,
  params: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/tools/${toolName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Tool ${toolName} failed: ${res.status}`);
  const data = await res.json();
  return JSON.stringify(data);
}

async function fetchLatestAppointment(): Promise<Appointment | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/appointment/latest`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.appointment ?? null;
  } catch {
    return null;
  }
}

export function useVoiceAgent(): UseVoiceAgentReturn {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messageIdRef = useRef(0);
  const toolCallIdRef = useRef(0);
  const toolCallsRef = useRef(toolCalls);
  toolCallsRef.current = toolCalls;

  function addPendingToolCall(name: string): string {
    const id = `tool-${++toolCallIdRef.current}`;
    setToolCalls((prev) => [
      ...prev,
      { id, name, status: "pending", timestamp: new Date() },
    ]);
    return id;
  }

  function resolveToolCall(id: string, result: string, isError = false) {
    setToolCalls((prev) =>
      prev.map((tc) =>
        tc.id === id
          ? { ...tc, status: isError ? "error" as const : "success" as const, result }
          : tc
      )
    );
  }

  const conversation = useConversation({
    clientTools: {
      lookup_providers: async (params: Record<string, unknown>) => {
        console.log("Client tool: lookup_providers", params);
        const id = addPendingToolCall("lookup_providers");
        try {
          const result = await callBackendTool("lookup_providers", params);
          const parsed = JSON.parse(result);
          const count = parsed.providers?.length ?? 0;
          resolveToolCall(id, `Found ${count} providers`);
          return result;
        } catch (e) {
          resolveToolCall(id, String(e), true);
          return JSON.stringify({ error: String(e) });
        }
      },
      simulate_call: async (params: Record<string, unknown>) => {
        console.log("Client tool: simulate_call", params);
        const id = addPendingToolCall("simulate_call");
        try {
          const result = await callBackendTool("simulate_call", params);
          const parsed = JSON.parse(result);
          resolveToolCall(id, `Slot: ${parsed.available_slot ?? "none"}`);
          return result;
        } catch (e) {
          resolveToolCall(id, String(e), true);
          return JSON.stringify({ error: String(e) });
        }
      },
      score_options: async (params: Record<string, unknown>) => {
        console.log("Client tool: score_options", params);
        const id = addPendingToolCall("score_options");
        try {
          const result = await callBackendTool("score_options", params);
          const parsed = JSON.parse(result);
          const best = parsed.best_option;
          resolveToolCall(id, best ? `Best: ${best.provider_name}` : "No best option");
          return result;
        } catch (e) {
          resolveToolCall(id, String(e), true);
          return JSON.stringify({ error: String(e) });
        }
      },
      book_appointment: async (params: Record<string, unknown>) => {
        console.log("Client tool: book_appointment", params);
        const id = addPendingToolCall("book_appointment");
        try {
          const result = await callBackendTool("book_appointment", params);
          const appt = await fetchLatestAppointment();
          if (appt) setAppointment(appt);
          resolveToolCall(id, "Appointment booked!");
          return result;
        } catch (e) {
          resolveToolCall(id, String(e), true);
          return JSON.stringify({ error: String(e) });
        }
      },
    },
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setStatus("connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setStatus("disconnected");
    },
    onMessage: (props: { message: string; source: string; role: string }) => {
      console.log("Message received:", props);
      const role = props.role === "agent" ? "agent" : "user";
      if (props.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${++messageIdRef.current}`,
            role,
            text: props.message,
            timestamp: new Date(),
          },
        ]);
      }
    },
    onUnhandledClientToolCall: (toolCall: { tool_name: string; tool_call_id: string }) => {
      console.warn("Unhandled client tool call:", toolCall);
    },
    onError: (err: string) => {
      console.error("Conversation error:", err);
      setError(typeof err === "string" ? err : "An error occurred");
      setStatus("disconnected");
    },
  });

  const startAgent = useCallback(async () => {
    try {
      setStatus("connecting");
      setError(null);
      setMessages([]);
      setToolCalls([]);
      setAppointment(null);

      await navigator.mediaDevices.getUserMedia({ audio: true });

      const response = await fetch(`${BACKEND_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      const agentUrl = data.agent_url;

      if (!agentUrl) {
        throw new Error("No agent_url received from backend");
      }

      console.log("Starting conversation with URL:", agentUrl);

      await conversation.startSession({
        signedUrl: agentUrl,
      });
    } catch (err) {
      console.error("Failed to start agent:", err);
      setError(err instanceof Error ? err.message : "Failed to start agent");
      setStatus("disconnected");
    }
  }, [conversation]);

  const stopAgent = useCallback(async () => {
    await conversation.endSession();
    setStatus("disconnected");
  }, [conversation]);

  return {
    status,
    isSpeaking: conversation.isSpeaking,
    messages,
    toolCalls,
    appointment,
    startAgent,
    stopAgent,
    error,
  };
}
