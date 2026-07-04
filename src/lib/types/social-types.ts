// ── Social Feature Types ────────────────────────────────────────────

export interface SocialUser {
    id: string;
    name: string;
    github: string;
    role: string;
    skills: string[];
    style: string;
    avatar: string; // first letter or initials
    avatarUrl?: string;
    isOnline: boolean;
}

export interface FriendRequest {
    id: string;
    from: SocialUser;
    timestamp: number;
    status: "pending" | "accepted" | "rejected";
}

export interface Friend extends SocialUser {
    addedAt: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export interface Conversation {
    id: string;
    type: "direct" | "team";
    name: string;
    participants: SocialUser[];
    messages: ChatMessage[];
    lastActivity: number;
}

export type NotificationType =
    | "friend_request"
    | "team_invite"
    | "match_found"
    | "hackathon_alert"
    | "smart_suggestion";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    actionUrl?: string;
    fromUser?: SocialUser;
}

export interface TeamInvite {
    id: string;
    from: SocialUser;
    teamName: string;
    timestamp: number;
    status: "pending" | "accepted" | "rejected";
}

export interface ActivityEvent {
    id: string;
    type: "team_join" | "friend_added" | "hackathon_new" | "match_found" | "team_formed" | "invite_sent";
    message: string;
    timestamp: number;
    user?: SocialUser;
    icon?: string;
}

export interface SocialState {
    currentUser: SocialUser;
    friends: Friend[];
    friendRequests: FriendRequest[];
    notifications: Notification[];
    conversations: Conversation[];
    teamInvites: TeamInvite[];
    activityFeed: ActivityEvent[];
    // Panel states
    isFriendsPanelOpen: boolean;
    isNotificationPanelOpen: boolean;
    isChatOpen: boolean;
    activeChatId: string | null;
}
