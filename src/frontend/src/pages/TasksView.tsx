import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Principal } from "@icp-sdk/core/principal";
import {
  Check,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Assignee } from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateTask,
  useDeleteTask,
  useEditTask,
  useGetBuckets,
  useGetTasks,
  useGetUserProfiles,
  useUpdateTask,
} from "../hooks/useQueries";

interface Props {
  currentUserName: string;
}

interface EditState {
  id: bigint;
  title: string;
  description: string;
  bucketId: string;
}

export default function TasksView({ currentUserName }: Props) {
  const { identity } = useInternetIdentity();
  const { principalByName } = useAppContext();
  const myPrincipal = identity?.getPrincipal();

  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useGetTasks();
  const { data: buckets = [] } = useGetBuckets();
  const { data: profiles } = useGetUserProfiles();
  const { mutate: createTask, isPending: creating } = useCreateTask();
  const { mutate: updateTask, isPending: updating } = useUpdateTask();
  const { mutate: deleteTask, isPending: deleting } = useDeleteTask();
  const { mutate: editTask, isPending: editing } = useEditTask();

  // Selected bucket state: "all" | "none" (general) | bucket id string
  const [activeBucketId, setActiveBucketId] = useState<string>("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [selectedBucketId, setSelectedBucketId] = useState<string>("none");
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  const allNames = profiles?.map((p) => p.name) ?? [];
  const assigneeOptions = Array.from(new Set([currentUserName, ...allNames]));

  // When activeBucketId changes, sync selectedBucketId for task form
  const handleSelectBucket = (id: string) => {
    setActiveBucketId(id);
    if (id !== "all") {
      setSelectedBucketId(id);
    } else {
      setSelectedBucketId("none");
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assigneeName) return;

    const resolvedPrincipalStr = principalByName.get(assigneeName);
    const assigneePrincipal: Principal = resolvedPrincipalStr
      ? Principal.fromText(resolvedPrincipalStr)
      : (myPrincipal ?? Principal.anonymous());

    const assignee: Assignee = {
      principal: assigneePrincipal,
      name: assigneeName,
    };

    const bucketId =
      selectedBucketId !== "none" ? BigInt(selectedBucketId) : null;

    createTask(
      {
        title: title.trim(),
        description: description.trim(),
        assignee,
        bucketId,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setAssigneeName("");
          toast.success("Task created");
        },
        onError: () => toast.error("Failed to create task"),
      },
    );
  };

  const handleToggle = (id: bigint, completed: boolean) => {
    updateTask(
      { id, completed: !completed },
      { onError: () => toast.error("Failed to update task") },
    );
  };

  const handleDelete = (id: bigint) => {
    setDeletingId(id);
    deleteTask(id, {
      onSuccess: () => {
        setDeletingId(null);
        toast.success("Task deleted");
      },
      onError: () => {
        setDeletingId(null);
        toast.error("Failed to delete task");
      },
    });
  };

  const handleEditOpen = (task: {
    id: bigint;
    title: string;
    description: string;
    bucketId?: bigint;
  }) => {
    setEditState({
      id: task.id,
      title: task.title,
      description: task.description,
      bucketId: task.bucketId != null ? task.bucketId.toString() : "none",
    });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState || !editState.title.trim()) return;
    const bucketId =
      editState.bucketId !== "none" ? BigInt(editState.bucketId) : null;
    editTask(
      {
        id: editState.id,
        title: editState.title.trim(),
        description: editState.description.trim(),
        bucketId,
      },
      {
        onSuccess: () => {
          setEditState(null);
          toast.success("Task updated");
        },
        onError: () => toast.error("Failed to update task"),
      },
    );
  };

  const handleEditCancel = () => setEditState(null);

  const allTasks = tasks ?? [];

  const sortTasks = (taskList: typeof allTasks) =>
    [...taskList].sort((a, b) => {
      if (a.completed === b.completed) return Number(b.timestamp - a.timestamp);
      return a.completed ? 1 : -1;
    });

  // Get tasks for currently selected bucket
  const visibleTasks = sortTasks(
    activeBucketId === "all"
      ? allTasks
      : activeBucketId === "none"
        ? allTasks.filter((t) => !t.bucketId)
        : allTasks.filter((t) => t.bucketId?.toString() === activeBucketId),
  );

  // Task counts per bucket for sidebar badges
  const taskCountFor = (id: string) => {
    if (id === "all") return allTasks.length;
    if (id === "none") return allTasks.filter((t) => !t.bucketId).length;
    return allTasks.filter((t) => t.bucketId?.toString() === id).length;
  };

  // Active bucket meta for display
  const activeBucketMeta =
    activeBucketId === "all"
      ? { label: "All Tasks", color: "#94a3b8" }
      : activeBucketId === "none"
        ? { label: "General", color: "#94a3b8" }
        : (() => {
            const b = buckets.find((b) => b.id.toString() === activeBucketId);
            return b
              ? { label: b.name, color: b.color }
              : { label: "All Tasks", color: "#94a3b8" };
          })();

  let globalIdx = 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left Bucket Panel ── */}
      <aside className="w-60 flex-shrink-0 border-r border-violet-100 bg-violet-50/30 flex flex-col">
        {/* Panel header */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0 border-b border-violet-100">
          <h2 className="text-xs font-semibold text-violet-600 uppercase tracking-wider">
            Buckets
          </h2>
        </div>

        {/* Bucket list */}
        <nav
          data-ocid="bucket.list"
          className="flex-1 overflow-y-auto px-2 space-y-0.5"
        >
          {/* All Tasks entry */}
          <button
            type="button"
            data-ocid="todo.all_tab"
            onClick={() => handleSelectBucket("all")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
              activeBucketId === "all"
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted",
            )}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "#94a3b8" }}
            />
            <span className="flex-1 text-left truncate">All Tasks</span>
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-medium",
                activeBucketId === "all"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {taskCountFor("all")}
            </span>
          </button>

          {/* Named buckets */}
          {buckets.map((bucket, i) => (
            <button
              key={bucket.id.toString()}
              type="button"
              data-ocid={`bucket.item.${i + 1}`}
              onClick={() => handleSelectBucket(bucket.id.toString())}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeBucketId === bucket.id.toString()
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: bucket.color }}
              />
              <span className="flex-1 text-left truncate">{bucket.name}</span>
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-medium",
                  activeBucketId === bucket.id.toString()
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {taskCountFor(bucket.id.toString())}
              </span>
            </button>
          ))}

          {/* General bucket */}
          <button
            type="button"
            onClick={() => handleSelectBucket("none")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeBucketId === "none"
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted",
            )}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-border"
              style={{ backgroundColor: "#94a3b8" }}
            />
            <span className="flex-1 text-left truncate">General</span>
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-medium",
                activeBucketId === "none"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {taskCountFor("none")}
            </span>
          </button>
        </nav>
      </aside>

      {/* ── Right Tasks Panel ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Right panel header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-violet-100 bg-violet-50/40 border-l-4 border-l-violet-500">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeBucketMeta.color }}
            />
            <h2 className="text-lg font-semibold text-foreground">
              {activeBucketMeta.label}
            </h2>
            <span className="text-sm text-muted-foreground">
              ({visibleTasks.length})
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Task creation form */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Task
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                data-ocid="todo.input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="resize-none"
                rows={2}
              />
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-32">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Assign to
                  </Label>
                  <Select value={assigneeName} onValueChange={setAssigneeName}>
                    <SelectTrigger data-ocid="todo.select">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {assigneeOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-32">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Bucket
                  </Label>
                  <Select
                    value={selectedBucketId}
                    onValueChange={setSelectedBucketId}
                  >
                    <SelectTrigger data-ocid="bucket.select">
                      <SelectValue placeholder="No bucket">
                        {selectedBucketId !== "none" ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  buckets.find(
                                    (b) => b.id.toString() === selectedBucketId,
                                  )?.color ?? "#94a3b8",
                              }}
                            />
                            {buckets.find(
                              (b) => b.id.toString() === selectedBucketId,
                            )?.name ?? "No bucket"}
                          </span>
                        ) : (
                          "No bucket"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No bucket (General)</SelectItem>
                      {buckets.map((b) => (
                        <SelectItem
                          key={b.id.toString()}
                          value={b.id.toString()}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: b.color }}
                            />
                            {b.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    data-ocid="todo.add_button"
                    disabled={creating || !title.trim() || !assigneeName}
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add Task"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Task list */}
          {tasksLoading && (
            <div className="space-y-3" data-ocid="todo.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {tasksError && (
            <div
              className="text-center py-12 text-sm text-destructive"
              data-ocid="todo.error_state"
            >
              Failed to load tasks.
            </div>
          )}

          {!tasksLoading && !tasksError && visibleTasks.length === 0 && (
            <div className="text-center py-16" data-ocid="todo.empty_state">
              <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium text-foreground">
                No tasks in{" "}
                <span style={{ color: activeBucketMeta.color }}>
                  {activeBucketMeta.label}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first task above.
              </p>
            </div>
          )}

          {!tasksLoading && !tasksError && visibleTasks.length > 0 && (
            <div className="space-y-2">
              {visibleTasks.map((task) => {
                globalIdx += 1;
                const idx = globalIdx;
                const taskBucketColor = task.bucketId
                  ? (buckets.find(
                      (b) => b.id.toString() === task.bucketId?.toString(),
                    )?.color ?? "#94a3b8")
                  : "#94a3b8";

                const isEditing = editState?.id === task.id;

                if (isEditing && editState) {
                  return (
                    <div
                      key={task.id.toString()}
                      data-ocid={`todo.item.${idx}`}
                      className="bg-card border border-primary/40 rounded-xl px-4 py-4 shadow-sm border-l-4"
                      style={{ borderLeftColor: taskBucketColor }}
                    >
                      <form onSubmit={handleEditSave} className="space-y-3">
                        <Input
                          data-ocid="task.edit.input"
                          value={editState.title}
                          onChange={(e) =>
                            setEditState((prev) =>
                              prev ? { ...prev, title: e.target.value } : prev,
                            )
                          }
                          placeholder="Task title"
                          required
                          autoFocus
                          className="text-sm font-medium"
                        />
                        <Textarea
                          data-ocid="task.edit.textarea"
                          value={editState.description}
                          onChange={(e) =>
                            setEditState((prev) =>
                              prev
                                ? { ...prev, description: e.target.value }
                                : prev,
                            )
                          }
                          placeholder="Description (optional)"
                          className="resize-none text-sm"
                          rows={2}
                        />
                        <div className="flex gap-3 items-end flex-wrap">
                          <div className="flex-1 min-w-32">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">
                              Bucket
                            </Label>
                            <Select
                              value={editState.bucketId}
                              onValueChange={(val) =>
                                setEditState((prev) =>
                                  prev ? { ...prev, bucketId: val } : prev,
                                )
                              }
                            >
                              <SelectTrigger data-ocid="task.edit.select">
                                <SelectValue placeholder="No bucket" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  No bucket (General)
                                </SelectItem>
                                {buckets.map((b) => (
                                  <SelectItem
                                    key={b.id.toString()}
                                    value={b.id.toString()}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: b.color }}
                                      />
                                      {b.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              data-ocid="task.edit.save_button"
                              disabled={editing || !editState.title.trim()}
                            >
                              {editing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              data-ocid="task.edit.cancel_button"
                              onClick={handleEditCancel}
                              disabled={editing}
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id.toString()}
                    data-ocid={`todo.item.${idx}`}
                    className={cn(
                      "flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3.5 shadow-sm transition-opacity border-l-4",
                      task.completed && "opacity-60",
                    )}
                    style={{ borderLeftColor: taskBucketColor }}
                  >
                    <Checkbox
                      data-ocid={`todo.checkbox.${idx}`}
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() =>
                        handleToggle(task.id, task.completed)
                      }
                      disabled={updating}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`task-${task.id}`}
                        className={cn(
                          "text-sm font-medium cursor-pointer leading-snug block",
                          task.completed &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </label>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground/70">
                          → {task.assignee.name}
                        </p>
                        {activeBucketId === "all" && task.bucketId && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                            style={{ backgroundColor: taskBucketColor }}
                          >
                            {
                              buckets.find(
                                (b) =>
                                  b.id.toString() === task.bucketId?.toString(),
                              )?.name
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`task.edit_button.${idx}`}
                        onClick={() => handleEditOpen(task)}
                        disabled={editing || deleting}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`todo.delete_button.${idx}`}
                        onClick={() => handleDelete(task.id)}
                        disabled={deleting && deletingId === task.id}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        {deleting && deletingId === task.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
