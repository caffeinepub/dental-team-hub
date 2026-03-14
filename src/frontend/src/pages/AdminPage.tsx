import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Invite } from "../backend.d";
import { InviteStatus } from "../backend.d";
import {
  useCreateInvite,
  useGetInvites,
  useRevokeInvite,
} from "../hooks/useQueries";

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: InviteStatus }) {
  if (status === InviteStatus.active) {
    return (
      <Badge
        variant="outline"
        className="text-emerald-600 border-emerald-200 bg-emerald-50"
      >
        Active
      </Badge>
    );
  }
  if (status === InviteStatus.used) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-border">
        Used
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-destructive border-destructive/30 bg-destructive/5"
    >
      Revoked
    </Badge>
  );
}

export default function AdminPage() {
  const { data: invites, isLoading } = useGetInvites();
  const { mutate: createInvite, isPending: isCreating } = useCreateInvite();
  const { mutate: revokeInvite, isPending: isRevoking } = useRevokeInvite();
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const handleGenerate = () => {
    createInvite(undefined, {
      onSuccess: (token) => {
        const url = `${window.location.origin}?invite=${token}`;
        setNewInviteUrl(url);
        toast.success("Invite link created!");
      },
      onError: () => toast.error("Failed to create invite. Are you an admin?"),
    });
  };

  const handleCopyNew = () => {
    if (!newInviteUrl) return;
    navigator.clipboard.writeText(newInviteUrl);
    toast.success("Copied to clipboard!");
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}?invite=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  };

  const handleRevoke = (token: string) => {
    setRevokingToken(token);
    revokeInvite(token, {
      onSuccess: () => {
        toast.success("Invite revoked.");
        setRevokingToken(null);
      },
      onError: () => {
        toast.error("Failed to revoke invite.");
        setRevokingToken(null);
      },
    });
  };

  return (
    <div data-ocid="admin.page" className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="border-b border-border px-8 py-5 flex items-center gap-3 bg-card">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-lg text-foreground font-semibold">
            Admin
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage team invitations
          </p>
        </div>
      </div>

      <div className="flex-1 p-8 space-y-8 max-w-4xl">
        {/* Generate invite */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">
                Generate Invite Link
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Share this link with a new team member. Each link is single-use.
              </p>
            </div>
            <Button
              data-ocid="admin.generate_invite.button"
              onClick={handleGenerate}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Generate Invite
            </Button>
          </div>

          {newInviteUrl && (
            <div className="flex gap-2 items-center">
              <Input
                readOnly
                value={newInviteUrl}
                className="font-mono text-xs bg-muted"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button variant="outline" size="icon" onClick={handleCopyNew}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Invites table */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">All Invites</h2>
          </div>

          {isLoading ? (
            <div
              data-ocid="admin.invites.loading_state"
              className="p-6 space-y-3"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !invites || invites.length === 0 ? (
            <div
              data-ocid="admin.invites.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ShieldCheck className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No invites yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Generate your first invite link above.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite: Invite, idx: number) => (
                  <TableRow
                    key={invite.token}
                    data-ocid={`admin.invites.row.${idx + 1}`}
                  >
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {invite.token.slice(0, 24)}…
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invite.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invite.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invite.status === InviteStatus.active && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-ocid={`admin.copy_link.button.${idx + 1}`}
                              onClick={() => handleCopyLink(invite.token)}
                            >
                              <Copy className="w-3.5 h-3.5 mr-1.5" />
                              Copy Link
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-ocid={`admin.revoke.button.${idx + 1}`}
                              onClick={() => handleRevoke(invite.token)}
                              disabled={
                                isRevoking && revokingToken === invite.token
                              }
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {isRevoking && revokingToken === invite.token ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  );
}
