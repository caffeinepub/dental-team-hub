import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState<string | null>(null);
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (_e: any) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="bg-sidebar sidebar-pattern lg:w-1/2 flex flex-col items-center justify-center p-12 text-sidebar-foreground">
        <div className="max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <img
                src="/assets/generated/dental-logo-transparent.dim_80x80.png"
                alt="Dental Team Hub"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="font-display text-4xl font-normal leading-tight mb-2">
              Dental Team Hub
            </h1>
            <p className="text-sidebar-foreground/70 text-base leading-relaxed">
              Your practice's communication center. Keep your team connected,
              organized, and focused on patient care.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 text-left pt-2">
            {[
              { icon: "💬", text: "Real-time team messaging" },
              { icon: "✓", text: "Shared task management" },
              { icon: "👥", text: "Team directory & presence" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 text-sm text-sidebar-foreground/80"
              >
                <span className="text-base">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Sign in to your practice
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Securely sign in using Internet Identity — no passwords required.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-accent/30 p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80">
                Internet Identity provides cryptographic security. Your identity
                is tied to your device, never to a password.
              </p>
            </div>

            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="auth.error_state"
              >
                {error}
              </p>
            )}

            <Button
              data-ocid="auth.submit_button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-11 text-sm font-medium"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Sign in with Internet Identity"
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
