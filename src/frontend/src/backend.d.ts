import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Invite {
    status: InviteStatus;
    token: string;
    createdAt: Time;
}
export interface Task {
    id: bigint;
    assignee: Assignee;
    title: string;
    creator: Principal;
    completed: boolean;
    bucketId?: bigint;
    description: string;
    timestamp: Time;
}
export interface ResourceEntry {
    id: bigint;
    url: string;
    categoryId: bigint;
    password: string;
    name: string;
}
export interface PrivateMessage {
    id: bigint;
    content: string;
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
}
export interface Bucket {
    id: bigint;
    name: string;
    createdAt: Time;
    color: string;
}
export interface CompanyEntry {
    id: bigint;
    website_url: string;
    password: string;
    name: string;
    category: CompanyEntryCategory;
}
export interface Assignee {
    principal: Principal;
    name: string;
}
export interface Message {
    id: bigint;
    content: string;
    sender: Principal;
    timestamp: Time;
    senderName: string;
}
export interface ResourceCategory {
    id: bigint;
    name: string;
}
export interface UserProfile {
    name: string;
    lastSeen: Time;
}
export enum CompanyEntryCategory {
    labs = "labs",
    insurance = "insurance",
    dental_supply = "dental_supply"
}
export enum InviteStatus {
    active = "active",
    revoked = "revoked",
    used = "used"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCompanyEntry(name: string, category: CompanyEntryCategory, website_url: string, password: string): Promise<void>;
    addMessage(content: string): Promise<void>;
    addResourceEntry(categoryId: bigint, name: string, url: string, password: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBucket(name: string, color: string): Promise<void>;
    createInvite(): Promise<string>;
    createResourceCategory(name: string): Promise<void>;
    createTask(title: string, description: string, assignee: Assignee, bucketId: bigint | null): Promise<void>;
    deleteBucket(id: bigint): Promise<void>;
    deleteCompanyEntry(id: bigint): Promise<void>;
    editCompanyEntry(id: bigint, name: string, website_url: string, password: string): Promise<void>;
    deleteResourceCategory(id: bigint): Promise<void>;
    deleteResourceEntry(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    editResourceEntry(id: bigint, name: string, url: string, password: string): Promise<void>;
    editTask(id: bigint, title: string, description: string, bucketId: bigint | null): Promise<void>;
    getBuckets(): Promise<Array<Bucket>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanyEntries(): Promise<Array<CompanyEntry>>;
    getDirectMessagesWith(partner: Principal): Promise<Array<PrivateMessage>>;
    getInvites(): Promise<Array<Invite>>;
    getMessages(): Promise<Array<Message>>;
    getResourceCategories(): Promise<Array<ResourceCategory>>;
    getResourceEntries(): Promise<Array<ResourceEntry>>;
    getTasks(): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfiles(): Promise<Array<UserProfile>>;
    isCallerAdmin(): Promise<boolean>;
    moveTaskToResourceCategory(taskId: bigint, resourceCategoryId: bigint): Promise<void>;
    register(name: string, inviteToken: string): Promise<void>;
    renameBucket(id: bigint, newName: string): Promise<void>;
    renameResourceCategory(id: bigint, newName: string): Promise<void>;
    revokeInvite(token: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendPrivateMessage(recipient: Principal, content: string): Promise<void>;
    toggleTaskCompleted(taskId: bigint): Promise<void>;
    updateLastSeen(): Promise<void>;
    updateTask(id: bigint, completed: boolean): Promise<void>;
}
