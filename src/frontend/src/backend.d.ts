import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PrivateMessage {
    id: bigint;
    content: string;
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
}
export type Time = bigint;
export interface Assignee {
    principal: Principal;
    name: string;
}
export interface Task {
    id: bigint;
    assignee: Assignee;
    title: string;
    creator: Principal;
    completed: boolean;
    description: string;
    timestamp: Time;
}
export interface Message {
    id: bigint;
    content: string;
    sender: Principal;
    timestamp: Time;
    senderName: string;
}
export interface UserProfile {
    name: string;
    lastSeen: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMessage(content: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createTask(title: string, description: string, assignee: Assignee): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDirectMessagesWith(partner: Principal): Promise<Array<PrivateMessage>>;
    getMessages(): Promise<Array<Message>>;
    getTasks(): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfiles(): Promise<Array<UserProfile>>;
    isCallerAdmin(): Promise<boolean>;
    register(name: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendPrivateMessage(recipient: Principal, content: string): Promise<void>;
    updateLastSeen(): Promise<void>;
    updateTask(id: bigint, completed: boolean): Promise<void>;
}
