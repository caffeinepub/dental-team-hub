import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MessageSquare, Users } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetUserProfiles } from "../hooks/useQueries";

function isOnline(lastSeen: bigint): boolean {
  const ms = Number(lastSeen / 1_000_000n);
  return Date.now() - ms < 2 * 60 * 1000;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DirectoryView() {
  const { data: profiles, isLoading, isError } = useGetUserProfiles();
  const { principalByName, setActiveView } = useAppContext();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();

  const handleMessage = (name: string) => {
    const principalStr = principalByName.get(name);
    if (!principalStr) return;
    setActiveView({
      type: "private",
      partnerPrincipal: principalStr,
      partnerName: name,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold text-foreground">
          Team Directory
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {profiles
            ? `${profiles.length} team member${profiles.length !== 1 ? "s" : ""}`
            : "Loading..."}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="directory.loading_state"
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {isError && (
          <div
            className="text-center py-12 text-sm text-destructive"
            data-ocid="directory.error_state"
          >
            Failed to load directory.
          </div>
        )}

        {!isLoading && !isError && (!profiles || profiles.length === 0) && (
          <div className="text-center py-20" data-ocid="directory.empty_state">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Team members appear here once they sign in.
            </p>
          </div>
        )}

        {!isLoading && profiles && profiles.length > 0 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="directory.list"
          >
            {profiles.map((profile, idx) => {
              const online = isOnline(profile.lastSeen);
              const knownPrincipal = principalByName.get(profile.name);
              const isCurrentUser = knownPrincipal === myPrincipal;
              const canMessage = !!knownPrincipal && !isCurrentUser;

              return (
                <div
                  key={profile.name}
                  data-ocid={`directory.item.${idx + 1}`}
                  className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center gap-4"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {getInitials(profile.name)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                        online ? "bg-green-500" : "bg-muted-foreground/30",
                      )}
                      title={online ? "Active" : "Away"}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {profile.name}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs mt-0.5",
                        online ? "text-green-600" : "text-muted-foreground",
                      )}
                    >
                      {online ? "Active now" : "Away"}
                    </p>
                  </div>

                  {canMessage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMessage(profile.name)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary flex-shrink-0"
                      title={`Message ${profile.name}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
