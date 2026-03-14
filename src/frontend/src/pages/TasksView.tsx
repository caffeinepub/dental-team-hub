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
import { ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Assignee } from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateTask,
  useDeleteTask,
  useGetTasks,
  useGetUserProfiles,
  useUpdateTask,
} from "../hooks/useQueries";

interface Props {
  currentUserName: string;
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
  const { data: profiles } = useGetUserProfiles();
  const { mutate: createTask, isPending: creating } = useCreateTask();
  const { mutate: updateTask, isPending: updating } = useUpdateTask();
  const { mutate: deleteTask, isPending: deleting } = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const allNames = profiles?.map((p) => p.name) ?? [];
  // Include current user if not in list
  const assigneeOptions = Array.from(new Set([currentUserName, ...allNames]));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assigneeName) return;

    // Try to resolve principal from known principals or fall back to own principal
    const resolvedPrincipalStr = principalByName.get(assigneeName);
    const assigneePrincipal: Principal = resolvedPrincipalStr
      ? Principal.fromText(resolvedPrincipalStr)
      : (myPrincipal ?? Principal.anonymous());

    const assignee: Assignee = {
      principal: assigneePrincipal,
      name: assigneeName,
    };

    createTask(
      { title: title.trim(), description: description.trim(), assignee },
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
      {
        onError: () => toast.error("Failed to update task"),
      },
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

  const sortedTasks = tasks
    ? [...tasks].sort((a, b) => {
        if (a.completed === b.completed)
          return Number(b.timestamp - a.timestamp);
        return a.completed ? 1 : -1;
      })
    : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Shared team task list
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* New task form */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
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
            <div className="flex gap-3">
              <div className="flex-1">
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

        {!tasksLoading && !tasksError && sortedTasks.length === 0 && (
          <div className="text-center py-16" data-ocid="todo.empty_state">
            <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first task above.
            </p>
          </div>
        )}

        {!tasksLoading && sortedTasks.length > 0 && (
          <div className="space-y-2">
            {sortedTasks.map((task, idx) => (
              <div
                key={task.id.toString()}
                data-ocid={`todo.item.${idx + 1}`}
                className={cn(
                  "flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3.5 shadow-xs transition-opacity",
                  task.completed && "opacity-60",
                )}
              >
                <Checkbox
                  data-ocid={`todo.checkbox.${idx + 1}`}
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => handleToggle(task.id, task.completed)}
                  disabled={updating}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={cn(
                      "text-sm font-medium cursor-pointer leading-snug block",
                      task.completed && "line-through text-muted-foreground",
                    )}
                  >
                    {task.title}
                  </label>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    → {task.assignee.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  data-ocid={`todo.delete_button.${idx + 1}`}
                  onClick={() => handleDelete(task.id)}
                  disabled={deleting && deletingId === task.id}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  {deleting && deletingId === task.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
