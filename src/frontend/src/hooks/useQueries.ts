import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Assignee,
  Bucket,
  CompanyEntry,
  Invite,
  Message,
  PrivateMessage,
  ResourceCategory,
  ResourceEntry,
  Task,
  UserProfile,
} from "../backend.d";
import { CompanyEntryCategory } from "../backend.d";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasks();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGetBuckets() {
  const { actor, isFetching } = useActor();
  return useQuery<Bucket[]>({
    queryKey: ["buckets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBuckets();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGetUserProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["userProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserProfiles();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useGetDirectMessages(partner: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PrivateMessage[]>({
    queryKey: ["directMessages", partner?.toString()],
    queryFn: async () => {
      if (!actor || !partner) return [];
      return actor.getDirectMessagesWith(partner);
    },
    enabled: !!actor && !isFetching && !!partner,
    refetchInterval: 5000,
  });
}

export function useAddMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addMessage(content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

export function useSendPrivateMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipient,
      content,
    }: { recipient: Principal; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.sendPrivateMessage(recipient, content);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["directMessages", vars.recipient.toString()],
      });
    },
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      assignee,
      bucketId = null,
    }: {
      title: string;
      description: string;
      assignee: Assignee;
      bucketId?: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createTask(title, description, assignee, bucketId ?? null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useEditTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      bucketId,
    }: {
      id: bigint;
      title: string;
      description: string;
      bucketId: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.editTask(id, title, description, bucketId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCreateBucket() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createBucket(name, color);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buckets"] }),
  });
}

export function useRenameBucket() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newName }: { id: bigint; newName: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.renameBucket(id, newName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buckets"] }),
  });
}

export function useDeleteBucket() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteBucket(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buckets"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      completed,
    }: { id: bigint; completed: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateTask(id, completed);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteTask(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useRegister() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, token }: { name: string; token: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.register(name, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useGetInvites() {
  const { actor, isFetching } = useActor();
  return useQuery<Invite[]>({
    queryKey: ["invites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInvites();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useCreateInvite() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return actor.createInvite();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites"] }),
  });
}

export function useRevokeInvite() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.revokeInvite(token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites"] }),
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCompanyEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<CompanyEntry[]>({
    queryKey: ["companyEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCompanyEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCompanyEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      category,
      website_url,
      username,
      password,
    }: {
      name: string;
      category: CompanyEntryCategory;
      website_url: string;
      username: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addCompanyEntry(
        name,
        category,
        website_url,
        username,
        password,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companyEntries"] }),
  });
}

export function useDeleteCompanyEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteCompanyEntry(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companyEntries"] }),
  });
}

export function useEditCompanyEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      website_url,
      username,
      password,
    }: {
      id: bigint;
      name: string;
      website_url: string;
      username: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.editCompanyEntry(id, name, website_url, username, password);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companyEntries"] }),
  });
}

// Resource Categories & Entries

export function useGetResourceCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<ResourceCategory[]>({
    queryKey: ["resourceCategories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getResourceCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetResourceEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<ResourceEntry[]>({
    queryKey: ["resourceEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getResourceEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateResourceCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createResourceCategory(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resourceCategories"] }),
  });
}

export function useDeleteResourceCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteResourceCategory(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resourceCategories"] });
      qc.invalidateQueries({ queryKey: ["resourceEntries"] });
    },
  });
}

export function useRenameResourceCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newName }: { id: bigint; newName: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.renameResourceCategory(id, newName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resourceCategories"] }),
  });
}

export function useAddResourceEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      name,
      url,
      username,
      password,
    }: {
      categoryId: bigint;
      name: string;
      url: string;
      username: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addResourceEntry(categoryId, name, url, username, password);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resourceEntries"] }),
  });
}

export function useDeleteResourceEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteResourceEntry(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resourceEntries"] }),
  });
}

export function useEditResourceEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      url,
      username,
      password,
    }: {
      id: bigint;
      name: string;
      url: string;
      username: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.editResourceEntry(id, name, url, username, password);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resourceEntries"] }),
  });
}

export { CompanyEntryCategory };
