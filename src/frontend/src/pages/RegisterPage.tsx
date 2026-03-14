import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRegister } from "../hooks/useQueries";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [token, setToken] = useState(
    () => new URLSearchParams(window.location.search).get("invite") ?? "",
  );
  const { mutate: register, isPending, error } = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!token.trim()) {
      toast.error("An invite code is required to join.");
      return;
    }
    register(
      { name: name.trim(), token: token.trim() },
      {
        onError: () =>
          toast.error("Failed to create profile. Please try again."),
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sidebar sidebar-pattern rounded-xl mx-auto mb-4 flex items-center justify-center">
            <img
              src="/assets/generated/dental-logo-transparent.dim_80x80.png"
              alt="Dental Team Hub"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">
            Welcome to the team!
          </h1>
          <p className="text-sm text-muted-foreground">
            Tell us your name so your colleagues know who you are.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 shadow-card space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium">
              Display name
            </Label>
            <Input
              id="displayName"
              data-ocid="register.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Sarah Chen"
              autoFocus
              maxLength={64}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteCode" className="text-sm font-medium">
              Invite code
            </Label>
            <Input
              id="inviteCode"
              data-ocid="register.token_input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your invite code here"
              maxLength={128}
            />
          </div>

          {error && (
            <p
              className="text-sm text-destructive"
              data-ocid="register.error_state"
            >
              Failed to create profile. Please try again.
            </p>
          )}

          <Button
            type="submit"
            data-ocid="register.submit_button"
            disabled={isPending || !name.trim()}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...
              </>
            ) : (
              "Join the team"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
