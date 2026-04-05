import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FullPost {
    id: PostId;
    content: string;
    meTooCount: bigint;
    mood: Mood;
    createdAt: bigint;
    supportCount: bigint;
    author: Principal;
    commentCount: bigint;
}
export type CommentId = bigint;
export interface Comment {
    content: string;
    createdAt: bigint;
    author: Principal;
    postId: PostId;
}
export type PostId = bigint;
export interface UserProfile {
    name: string;
}
export enum Mood {
    sad = "sad",
    hopeful = "hopeful",
    stress = "stress",
    anxious = "anxious",
    happy = "happy",
    angry = "angry",
    love = "love"
}
export enum Reaction {
    meToo = "meToo",
    support = "support"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(postId: PostId, content: string): Promise<CommentId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPost(mood: Mood, content: string): Promise<PostId>;
    getAllPosts(): Promise<Array<FullPost>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: PostId): Promise<Array<Comment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    reactToPost(postId: PostId, reaction: Reaction): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
