import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetDirectMessages,
  useSendPrivateMessage,
} from "../hooks/useQueries";

function formatTime(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  partnerPrincipal: Principal;
  partnerName: string;
  currentUserName: string;
}

export default function PrivateThreadView({
  partnerPrincipal,
  partnerName,
  currentUserName,
}: Props) {
  const { setActiveView } = useAppContext();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();

  const {
    data: messages,
    isLoading,
    isError,
  } = useGetDirectMessages(partnerPrincipal);
  const { mutate: sendMessage, isPending } = useSendPrivateMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messageCount = messages?.length ?? 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll triggered by message count
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    sendMessage(
      { recipient: partnerPrincipal, content },
      {
        onError: () => toast.error("Failed to send message"),
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const partnerInitials = partnerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card flex items-center gap-4">
        <Button
          data-ocid="private.back.button"
          variant="ghost"
          size="icon"
          onClick={() => setActiveView({ type: "chat" })}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-foreground">
              {partnerInitials}
            </span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {partnerName}
            </h2>
            <p className="text-xs text-muted-foreground">Private thread</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading && (
          <div className="space-y-4" data-ocid="private.loading_state">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-10 w-48" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div
            className="text-center py-12 text-sm text-destructive"
            data-ocid="private.error_state"
          >
            Failed to load messages.
          </div>
        )}

        {!isLoading && !isError && messages?.length === 0 && (
          <div className="text-center py-20" data-ocid="private.empty_state">
            <p className="text-3xl mb-3">🔒</p>
            <p className="font-medium text-foreground">
              Start a private conversation
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Only you and {partnerName} can see these messages.
            </p>
          </div>
        )}

        {!isLoading && messages && messages.length > 0 && (
          <div className="space-y-3">
            {messages.map((msg, idx) => {
              const isMine = msg.sender.toString() === myPrincipal;
              const senderName = isMine ? currentUserName : partnerName;
              return (
                <div
                  key={msg.id.toString()}
                  data-ocid={`private.item.${idx + 1}`}
                  className={cn(
                    "flex gap-2.5 max-w-[80%]",
                    isMine ? "ml-auto flex-row-reverse" : "",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold mt-1",
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {senderName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div
                    className={cn(
                      "flex flex-col",
                      isMine ? "items-end" : "items-start",
                    )}
                  >
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
            data-ocid="private.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partnerName}...`}
            disabled={isPending}
            className="flex-1"
          />
          <Button
            data-ocid="private.submit_button"
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
