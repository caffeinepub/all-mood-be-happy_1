import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Comment,
  type FullPost,
  Mood,
  Reaction,
  type UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export type { FullPost, Comment, UserProfile };
export { Mood, Reaction };

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<FullPost[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useGetComments(postId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === null) return [];
      return actor.getComments(postId);
    },
    enabled: !!actor && !isFetching && postId !== null,
  });
}

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

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mood, content }: { mood: Mood; content: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createPost(mood, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useReactToPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      reaction,
    }: { postId: bigint; reaction: Reaction }) => {
      if (!actor) throw new Error("Not connected");
      return actor.reactToPost(postId, reaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: { postId: bigint; content: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addComment(postId, content);
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", postId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}
