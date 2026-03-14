import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import { CheckSquare, LogOut, MessageSquare, Users } from "lucide-react";
import type { UserProfile } from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import ChatView from "../pages/ChatView";
import DirectoryView from "../pages/DirectoryView";
import PrivateThreadView from "../pages/PrivateThreadView";
import TasksView from "../pages/TasksView";

interface Props {
  userProfile: UserProfile | null | undefined;
}

export default function MainLayout({ userProfile }: Props) {
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();
  const { activeView, setActiveView } = useAppContext();

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  const navItems = [
    {
      type: "chat" as const,
      label: "Team Chat",
      icon: MessageSquare,
      ocid: "nav.chat.link",
    },
    {
      type: "tasks" as const,
      label: "Tasks",
      icon: CheckSquare,
      ocid: "nav.tasks.link",
    },
    {
      type: "directory" as const,
      label: "Directory",
      icon: Users,
      ocid: "nav.directory.link",
    },
  ];

  const isNavActive = (type: string) => {
    if (activeView.type === "private") return false;
    return activeView.type === type;
  };

  const displayName = userProfile?.name ?? "Team Member";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-sidebar sidebar-pattern flex flex-col border-r border-sidebar-border">
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <img
                src="/assets/generated/dental-logo-transparent.dim_80x80.png"
                alt=""
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <p className="font-display text-sidebar-foreground text-sm leading-tight">
                Dental Team
              </p>
              <p className="font-display text-sidebar-foreground text-sm leading-tight">
                Hub
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ type, label, icon: Icon, ocid }) => (
            <button
              type="button"
              key={type}
              data-ocid={ocid}
              onClick={() => setActiveView({ type })}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                isNavActive(type)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/50">Online</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 px-3"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        {activeView.type === "chat" && <ChatView />}
        {activeView.type === "tasks" && (
          <TasksView currentUserName={displayName} />
        )}
        {activeView.type === "directory" && <DirectoryView />}
        {activeView.type === "private" && (
          <PrivateThreadView
            partnerPrincipal={Principal.fromText(activeView.partnerPrincipal)}
            partnerName={activeView.partnerName}
            currentUserName={displayName}
          />
        )}
      </main>
    </div>
  );
}
