import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  CompanyEntry,
  Invite,
  ResourceCategory,
  ResourceEntry,
} from "../backend.d";
import { CompanyEntryCategory, InviteStatus } from "../backend.d";
import {
  useAddCompanyEntry,
  useAddResourceEntry,
  useCreateBucket,
  useCreateInvite,
  useCreateResourceCategory,
  useDeleteBucket,
  useDeleteCompanyEntry,
  useDeleteResourceCategory,
  useDeleteResourceEntry,
  useEditCompanyEntry,
  useEditResourceEntry,
  useGetBuckets,
  useGetCompanyEntries,
  useGetInvites,
  useGetResourceCategories,
  useGetResourceEntries,
  useRenameBucket,
  useRenameResourceCategory,
  useRevokeInvite,
} from "../hooks/useQueries";

const PRESET_COLORS = [
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Green", value: "#22c55e" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
];

const CATEGORY_TABS: { label: string; value: CompanyEntryCategory }[] = [
  { label: "Labs", value: CompanyEntryCategory.labs },
  { label: "Dental Supply", value: CompanyEntryCategory.dental_supply },
  { label: "Insurance", value: CompanyEntryCategory.insurance },
];

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

function PasswordCell({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-sm">
        {visible ? password : "•".repeat(Math.min(password.length, 12))}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
}

function CompanyEntryRow({
  entry,
  index,
  onDelete,
  isDeleting,
}: {
  entry: CompanyEntry;
  index: number;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
}) {
  const { mutate: editEntry, isPending: isSaving } = useEditCompanyEntry();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(entry.name);
  const [editUrl, setEditUrl] = useState(entry.website_url);
  const [editPassword, setEditPassword] = useState(entry.password);
  const [showEditPw, setShowEditPw] = useState(false);

  const handleSave = () => {
    if (!editName.trim() || !editUrl.trim()) return;
    editEntry(
      {
        id: entry.id,
        name: editName.trim(),
        website_url: editUrl.trim(),
        password: editPassword,
      },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("Entry updated");
        },
        onError: () => toast.error("Failed to update entry"),
      },
    );
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditName(entry.name);
    setEditUrl(entry.website_url);
    setEditPassword(entry.password);
  };

  if (editing) {
    return (
      <div
        data-ocid={`company.item.${index}`}
        className="flex flex-col gap-2 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Name"
            className="h-8 text-sm"
            autoFocus
          />
          <Input
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-8 text-sm"
            type="url"
          />
          <div className="relative">
            <Input
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Password"
              type={showEditPw ? "text" : "password"}
              className="h-8 text-sm pr-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShowEditPw((v) => !v)}
              aria-label={showEditPw ? "Hide password" : "Show password"}
            >
              {showEditPw ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7"
            data-ocid={`company.save_button.${index}`}
            onClick={handleSave}
            disabled={isSaving || !editName.trim() || !editUrl.trim()}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Check className="w-3.5 h-3.5 mr-1" />
            )}
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            data-ocid={`company.cancel_button.${index}`}
            onClick={handleCancelEdit}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid={`company.item.${index}`}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">
          {entry.name}
        </p>
        <a
          href={entry.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 w-fit"
        >
          <ExternalLink className="w-3 h-3" />
          {entry.website_url}
        </a>
      </div>
      <div className="flex-shrink-0">
        <PasswordCell password={entry.password} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        data-ocid={`company.edit_button.${index}`}
        onClick={() => setEditing(true)}
        className="h-7 w-7 text-muted-foreground hover:text-primary flex-shrink-0"
        aria-label={`Edit ${entry.name}`}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        data-ocid={`company.delete_button.${index}`}
        onClick={() => onDelete(entry.id)}
        disabled={isDeleting}
        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
        aria-label={`Delete ${entry.name}`}
      >
        {isDeleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
}

function AddCompanyForm({ category }: { category: CompanyEntryCategory }) {
  const { mutate: addEntry, isPending } = useAddCompanyEntry();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    addEntry(
      {
        name: name.trim(),
        category,
        website_url: url.trim(),
        password: password,
      },
      {
        onSuccess: () => {
          setName("");
          setUrl("");
          setPassword("");
          toast.success("Entry added successfully");
        },
        onError: () => toast.error("Failed to add entry"),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="pt-4 border-t border-border space-y-3"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Add New Entry
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`company-name-${category}`} className="text-xs">
            Company Name
          </Label>
          <Input
            id={`company-name-${category}`}
            data-ocid="company.input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. BioHorizons"
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`company-url-${category}`} className="text-xs">
            Website URL
          </Label>
          <Input
            id={`company-url-${category}`}
            data-ocid="company.input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-8 text-sm"
            type="url"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`company-pw-${category}`} className="text-xs">
            Password
          </Label>
          <div className="relative">
            <Input
              id={`company-pw-${category}`}
              data-ocid="company.input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type={showPw ? "text" : "password"}
              className="h-8 text-sm pr-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      <Button
        type="submit"
        data-ocid="company.submit_button"
        disabled={isPending || !name.trim() || !url.trim()}
        size="sm"
        className="h-8"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
        ) : (
          <Plus className="w-3.5 h-3.5 mr-1.5" />
        )}
        Add Entry
      </Button>
    </form>
  );
}

function CompanyDirectorySection() {
  const { data: entries = [], isLoading } = useGetCompanyEntries();
  const {
    mutate: deleteEntry,
    isPending: isDeleting,
    variables: deletingId,
  } = useDeleteCompanyEntry();

  const handleDelete = (id: bigint) => {
    deleteEntry(id, {
      onSuccess: () => toast.success("Entry deleted"),
      onError: () => toast.error("Failed to delete entry"),
    });
  };

  const entriesByCategory = (cat: CompanyEntryCategory) =>
    entries.filter((e) => e.category === cat);

  return (
    <section
      data-ocid="company.section"
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <div>
          <h2 className="font-semibold text-foreground">Company Directory</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Save links and credentials for labs, suppliers, and insurance
            companies.
          </p>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div data-ocid="company.loading_state" className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue={CompanyEntryCategory.labs}>
            <TabsList className="mb-4">
              {CATEGORY_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  data-ocid={`company.${tab.value}.tab`}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORY_TABS.map((tab) => {
              const categoryEntries = entriesByCategory(tab.value);
              return (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="space-y-3"
                >
                  {categoryEntries.length === 0 ? (
                    <div
                      data-ocid="company.empty_state"
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      No {tab.label.toLowerCase()} entries yet. Add one below.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryEntries.map((entry, i) => (
                        <CompanyEntryRow
                          key={entry.id.toString()}
                          entry={entry}
                          index={i + 1}
                          onDelete={handleDelete}
                          isDeleting={isDeleting && deletingId === entry.id}
                        />
                      ))}
                    </div>
                  )}
                  <AddCompanyForm category={tab.value} />
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </section>
  );
}

// ─── Resource Links Section ───────────────────────────────────────────────────

function AddResourceEntryForm({ categoryId }: { categoryId: bigint }) {
  const { mutate: addEntry, isPending } = useAddResourceEntry();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    addEntry(
      { categoryId, name: name.trim(), url: url.trim(), password },
      {
        onSuccess: () => {
          setName("");
          setUrl("");
          setPassword("");
          toast.success("Entry added");
        },
        onError: () => toast.error("Failed to add entry"),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 pt-3 border-t border-border space-y-2"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Add Link
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          data-ocid="resource.entry.input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-8 text-sm"
          required
          aria-label="Entry name"
        />
        <Input
          data-ocid="resource.entry.input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="h-8 text-sm"
          type="url"
          required
          aria-label="Entry URL"
        />
        <div className="relative">
          <Input
            data-ocid="resource.entry.input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (optional)"
            type={showPw ? "text" : "password"}
            className="h-8 text-sm pr-8"
            aria-label="Entry password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
      <Button
        type="submit"
        data-ocid="resource.entry.submit_button"
        disabled={isPending || !name.trim() || !url.trim()}
        size="sm"
        className="h-8"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
        ) : (
          <Plus className="w-3.5 h-3.5 mr-1.5" />
        )}
        Add
      </Button>
    </form>
  );
}

function ResourceEntryRow({
  entry,
  index,
}: {
  entry: ResourceEntry;
  index: number;
}) {
  const { mutate: deleteEntry, isPending: isDeleting } =
    useDeleteResourceEntry();
  const { mutate: editEntry, isPending: isSaving } = useEditResourceEntry();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(entry.name);
  const [editUrl, setEditUrl] = useState(entry.url);
  const [editPassword, setEditPassword] = useState(entry.password);
  const [showEditPw, setShowEditPw] = useState(false);

  const handleSave = () => {
    if (!editName.trim() || !editUrl.trim()) return;
    editEntry(
      {
        id: entry.id,
        name: editName.trim(),
        url: editUrl.trim(),
        password: editPassword,
      },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("Entry updated");
        },
        onError: () => toast.error("Failed to update entry"),
      },
    );
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditName(entry.name);
    setEditUrl(entry.url);
    setEditPassword(entry.password);
  };

  if (editing) {
    return (
      <div
        data-ocid={`resource.entry.item.${index}`}
        className="flex flex-col gap-2 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Name"
            className="h-8 text-sm"
            autoFocus
          />
          <Input
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-8 text-sm"
            type="url"
          />
          <div className="relative">
            <Input
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Password"
              type={showEditPw ? "text" : "password"}
              className="h-8 text-sm pr-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShowEditPw((v) => !v)}
              aria-label={showEditPw ? "Hide password" : "Show password"}
            >
              {showEditPw ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7"
            onClick={handleSave}
            disabled={isSaving || !editName.trim() || !editUrl.trim()}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Check className="w-3.5 h-3.5 mr-1" />
            )}
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={handleCancelEdit}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid={`resource.entry.item.${index}`}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">
          {entry.name}
        </p>
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 w-fit"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="truncate max-w-[240px]">{entry.url}</span>
        </a>
      </div>
      <div className="flex-shrink-0">
        <PasswordCell password={entry.password} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        data-ocid={`resource.entry.edit_button.${index}`}
        onClick={() => setEditing(true)}
        className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
        aria-label={`Edit ${entry.name}`}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        data-ocid={`resource.entry.delete_button.${index}`}
        onClick={() =>
          deleteEntry(entry.id, {
            onSuccess: () => toast.success("Entry deleted"),
            onError: () => toast.error("Failed to delete entry"),
          })
        }
        disabled={isDeleting}
        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
        aria-label={`Delete ${entry.name}`}
      >
        {isDeleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
}

function ResourceCategoryPanel({
  category,
  entries,
  index,
}: {
  category: ResourceCategory;
  entries: ResourceEntry[];
  index: number;
}) {
  const { mutate: deleteCategory, isPending: isDeleting } =
    useDeleteResourceCategory();
  const { mutate: renameCategory } = useRenameResourceCategory();
  const [expanded, setExpanded] = useState(true);
  const [renamingMode, setRenamingMode] = useState(false);
  const [renamingValue, setRenamingValue] = useState(category.name);
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);

  const handleRename = () => {
    if (!renamingValue.trim()) return;
    setIsRenamingLoading(true);
    renameCategory(
      { id: category.id, newName: renamingValue.trim() },
      {
        onSuccess: () => {
          setRenamingMode(false);
          setIsRenamingLoading(false);
          toast.success("Category renamed");
        },
        onError: () => {
          setIsRenamingLoading(false);
          toast.error("Failed to rename category");
        },
      },
    );
  };

  const handleCancelRename = () => {
    setRenamingMode(false);
    setRenamingValue(category.name);
  };

  return (
    <div
      data-ocid={`resource.category.item.${index}`}
      className="border border-border rounded-xl overflow-hidden"
    >
      {/* Category header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${category.name}`}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          {renamingMode ? (
            <div
              role="presentation"
              className="flex items-center gap-2 flex-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Input
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") handleCancelRename();
                }}
                className="h-7 text-sm flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                data-ocid={`resource.category.edit_button.${index}`}
                onClick={handleRename}
                disabled={isRenamingLoading || !renamingValue.trim()}
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                aria-label="Save rename"
              >
                {isRenamingLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelRename}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                aria-label="Cancel rename"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <span className="font-semibold text-sm text-foreground truncate">
              {category.name}
            </span>
          )}
        </button>
        {!renamingMode && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-muted-foreground mr-1">
              {entries.length} {entries.length === 1 ? "link" : "links"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              data-ocid={`resource.category.edit_button.${index}`}
              onClick={() => {
                setRenamingMode(true);
                setExpanded(true);
              }}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Rename ${category.name}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              data-ocid={`resource.category.delete_button.${index}`}
              onClick={() =>
                deleteCategory(category.id, {
                  onSuccess: () => toast.success("Category deleted"),
                  onError: () => toast.error("Failed to delete category"),
                })
              }
              disabled={isDeleting}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label={`Delete ${category.name}`}
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Category body */}
      {expanded && (
        <div className="p-4 space-y-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              No links yet. Add one below.
            </p>
          ) : (
            entries.map((entry, i) => (
              <ResourceEntryRow
                key={entry.id.toString()}
                entry={entry}
                index={i + 1}
              />
            ))
          )}
          <AddResourceEntryForm categoryId={category.id} />
        </div>
      )}
    </div>
  );
}

function ResourceLinksSection() {
  const { data: categories = [], isLoading: catsLoading } =
    useGetResourceCategories();
  const { data: entries = [], isLoading: entriesLoading } =
    useGetResourceEntries();
  const { mutate: createCategory, isPending: isCreating } =
    useCreateResourceCategory();
  const [newCategoryName, setNewCategoryName] = useState("");

  const isLoading = catsLoading || entriesLoading;

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createCategory(newCategoryName.trim(), {
      onSuccess: () => {
        setNewCategoryName("");
        toast.success("Category created");
      },
      onError: () => toast.error("Failed to create category"),
    });
  };

  const entriesForCategory = (catId: bigint) =>
    entries.filter((e) => e.categoryId === catId);

  return (
    <section
      data-ocid="resource.section"
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <Link2 className="w-4 h-4 text-muted-foreground" />
        <div>
          <h2 className="font-semibold text-foreground">Resource Links</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize site links and credentials by custom categories.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Create category form */}
        <form
          onSubmit={handleCreateCategory}
          className="flex items-center gap-3"
        >
          <Input
            data-ocid="resource.category.input"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name (e.g. Patient Portals)"
            className="h-9 flex-1"
          />
          <Button
            type="submit"
            data-ocid="resource.category.primary_button"
            disabled={isCreating || !newCategoryName.trim()}
            className="h-9 whitespace-nowrap"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Category
              </>
            )}
          </Button>
        </form>

        {/* Categories list */}
        {isLoading ? (
          <div data-ocid="resource.loading_state" className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div
            data-ocid="resource.empty_state"
            className="text-center py-10 text-sm text-muted-foreground"
          >
            <Link2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            No categories yet. Create one above to start organizing links.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat, i) => (
              <ResourceCategoryPanel
                key={cat.id.toString()}
                category={cat}
                entries={entriesForCategory(cat.id)}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminPage() {
  const { data: invites, isLoading } = useGetInvites();
  const { mutate: createInvite, isPending: isCreating } = useCreateInvite();
  const { mutate: revokeInvite, isPending: isRevoking } = useRevokeInvite();
  const { data: buckets = [], isLoading: bucketsLoading } = useGetBuckets();
  const { mutate: createBucket, isPending: creatingBucket } = useCreateBucket();
  const { mutate: deleteBucket } = useDeleteBucket();
  const { mutate: renameBucket } = useRenameBucket();

  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  // Bucket form state
  const [bucketName, setBucketName] = useState("");
  const [bucketColor, setBucketColor] = useState(PRESET_COLORS[0].value);
  const [deletingBucketId, setDeletingBucketId] = useState<bigint | null>(null);

  // Rename state
  const [editingBucketId, setEditingBucketId] = useState<bigint | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renamingBucketId, setRenamingBucketId] = useState<bigint | null>(null);

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

  const handleAddBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bucketName.trim()) return;
    createBucket(
      { name: bucketName.trim(), color: bucketColor },
      {
        onSuccess: () => {
          setBucketName("");
          setBucketColor(PRESET_COLORS[0].value);
          toast.success("Bucket created");
        },
        onError: () => toast.error("Failed to create bucket"),
      },
    );
  };

  const handleDeleteBucket = (id: bigint) => {
    setDeletingBucketId(id);
    deleteBucket(id, {
      onSuccess: () => {
        setDeletingBucketId(null);
        toast.success("Bucket deleted");
      },
      onError: () => {
        setDeletingBucketId(null);
        toast.error("Failed to delete bucket");
      },
    });
  };

  const handleStartEdit = (id: bigint, currentName: string) => {
    setEditingBucketId(id);
    setEditingName(currentName);
  };

  const handleCancelEdit = () => {
    setEditingBucketId(null);
    setEditingName("");
  };

  const handleSaveRename = (id: bigint) => {
    if (!editingName.trim()) return;
    setRenamingBucketId(id);
    renameBucket(
      { id, newName: editingName.trim() },
      {
        onSuccess: () => {
          setEditingBucketId(null);
          setEditingName("");
          setRenamingBucketId(null);
          toast.success("Bucket renamed");
        },
        onError: () => {
          setRenamingBucketId(null);
          toast.error("Failed to rename bucket");
        },
      },
    );
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
            Manage team invitations, task buckets, and company directory
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

        {/* Manage Buckets */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Manage Buckets</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create, rename, and manage color-coded task buckets for your team.
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Existing buckets */}
            {bucketsLoading ? (
              <div data-ocid="bucket.loading_state" className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : buckets.length === 0 ? (
              <div
                data-ocid="bucket.empty_state"
                className="text-center py-6 text-sm text-muted-foreground"
              >
                No buckets yet. Create your first one below.
              </div>
            ) : (
              <ul className="space-y-2">
                {buckets.map((bucket, i) => (
                  <li
                    key={bucket.id.toString()}
                    data-ocid={`bucket.item.${i + 1}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted/30"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: bucket.color }}
                    />
                    {editingBucketId === bucket.id ? (
                      <>
                        <Input
                          data-ocid={`bucket.input.${i + 1}`}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(bucket.id);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          className="h-7 text-sm flex-1"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`bucket.save_button.${i + 1}`}
                          onClick={() => handleSaveRename(bucket.id)}
                          disabled={
                            renamingBucketId === bucket.id ||
                            !editingName.trim()
                          }
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          aria-label="Save rename"
                        >
                          {renamingBucketId === bucket.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`bucket.cancel_button.${i + 1}`}
                          onClick={handleCancelEdit}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          aria-label="Cancel rename"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {bucket.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`bucket.edit_button.${i + 1}`}
                          onClick={() =>
                            handleStartEdit(bucket.id, bucket.name)
                          }
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          aria-label={`Rename ${bucket.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`bucket.delete_button.${i + 1}`}
                          onClick={() => handleDeleteBucket(bucket.id)}
                          disabled={deletingBucketId === bucket.id}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${bucket.name}`}
                        >
                          {deletingBucketId === bucket.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Create bucket form */}
            <form
              onSubmit={handleAddBucket}
              className="flex items-end gap-3 pt-2 border-t border-border"
            >
              <div className="flex-1">
                <label
                  htmlFor="bucket-name-input"
                  className="text-xs text-muted-foreground mb-1.5 block font-medium"
                >
                  Bucket name
                </label>
                <Input
                  id="bucket-name-input"
                  data-ocid="bucket.input"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  placeholder="e.g. Morning Prep, Patient Followups"
                  className="h-9"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                  Color
                </p>
                <div className="flex gap-1.5 items-center h-9">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setBucketColor(c.value)}
                      title={c.label}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all hover:scale-110",
                        bucketColor === c.value
                          ? "border-foreground scale-110"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                data-ocid="bucket.primary_button"
                disabled={creatingBucket || !bucketName.trim()}
                className="h-9"
              >
                {creatingBucket ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create Bucket
                  </>
                )}
              </Button>
            </form>
          </div>
        </section>

        {/* Company Directory */}
        <CompanyDirectorySection />

        {/* Resource Links */}
        <ResourceLinksSection />

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
