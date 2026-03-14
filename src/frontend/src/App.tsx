import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import MainLayout from "./components/MainLayout";
import { AppProvider } from "./context/AppContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AuthPage from "./pages/AuthPage";
import RegisterPage from "./pages/RegisterPage";

function AppInner() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: profile, isLoading, isFetched } = useGetCallerUserProfile();

  // Update last seen periodically
  useEffect(() => {
    if (!actor || !identity) return;
    const interval = setInterval(async () => {
      try {
        await actor.updateLastSeen();
      } catch {}
    }, 30000);
    // Also update immediately
    actor.updateLastSeen().catch(() => {});
    return () => clearInterval(interval);
  }, [actor, identity]);

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (actorFetching || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 w-48">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (isFetched && profile === null) {
    return <RegisterPage />;
  }

  return <MainLayout userProfile={profile} />;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
      <Toaster position="top-right" />
    </AppProvider>
  );
}
