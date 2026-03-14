import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddMessage, useGetMessages } from "../hooks/useQueries";

function formatTime(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ChatView() {
  const { data: messages, isLoading, isError } = useGetMessages();
  const { mutate: addMessage, isPending } = useAddMessage();
  const { registerPrincipal, setActiveView } = useAppContext();
  const { identity } = useInternetIdentity();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const myPrincipal = identity?.getPrincipal().toString();

  // Register principals from messages
  useEffect(() => {
    if (!messages) return;
    for (const m of messages) {
      registerPrincipal(m.sender, m.senderName);
    }
  }, [messages, registerPrincipal]);

  // Scroll to bottom when messages change
  const messageCount = messages?.length ?? 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll triggered by message count
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    addMessage(content, {
      onError: () => toast.error("Failed to send message"),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openPrivateThread = (senderPrincipal: string, senderName: string) => {
    if (senderPrincipal === myPrincipal) return;
    setActiveView({
      type: "private",
      partnerPrincipal: senderPrincipal,
      partnerName: senderName,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold text-foreground">Team Chat</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Messages to the whole team
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading && (
          <div className="space-y-4" data-ocid="chat.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-64" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div
            className="text-center py-12 text-sm text-destructive"
            data-ocid="chat.error_state"
          >
            Failed to load messages.
          </div>
        )}

        {!isLoading && !isError && messages?.length === 0 && (
          <div className="text-center py-20" data-ocid="chat.empty_state">
            <p className="text-3xl mb-3">💬</p>
            <p className="font-medium text-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to say something!
            </p>
          </div>
        )}

        {!isLoading && messages && messages.length > 0 && (
          <div className="space-y-3" data-ocid="chat.list">
            {messages.map((msg, idx) => {
              const isMine = msg.sender.toString() === myPrincipal;
              return (
                <div
                  key={msg.id.toString()}
                  data-ocid={`chat.item.${idx + 1}`}
                  className={cn(
                    "flex gap-2.5 max-w-[80%]",
                    isMine ? "ml-auto flex-row-reverse" : "",
                  )}
                >
                  {!isMine && (
                    <button
                      type="button"
                      onClick={() =>
                        openPrivateThread(msg.sender.toString(), msg.senderName)
                      }
                      className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary-foreground hover:opacity-80 transition-opacity mt-1"
                      title={`Message ${msg.senderName} privately`}
                    >
                      {getInitials(msg.senderName)}
                    </button>
                  )}
                  <div
                    className={cn(
                      "flex flex-col",
                      isMine ? "items-end" : "items-start",
                    )}
                  >
                    {!isMine && (
                      <button
                        type="button"
                        onClick={() =>
                          openPrivateThread(
                            msg.sender.toString(),
                            msg.senderName,
                          )
                        }
                        className="text-xs font-medium text-foreground/70 mb-1 hover:text-primary transition-colors"
                      >
                        {msg.senderName}
                      </button>
                    )}
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isMine
                          ? "bg-primary text-primary-foreground msg-self rounded-tr-sm"
                          : "bg-card border border-border text-foreground msg-other rounded-tl-sm shadow-xs",
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            data-ocid="chat.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the team..."
            disabled={isPending}
            className="flex-1"
          />
          <Button
            data-ocid="chat.submit_button"
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
