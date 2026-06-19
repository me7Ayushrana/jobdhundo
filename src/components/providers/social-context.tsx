"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type {
    SocialUser, Friend, FriendRequest, ChatMessage, Conversation,
    Notification, TeamInvite, ActivityEvent, SocialState, NotificationType
} from "@/lib/types/social-types";
import { app, auth, db, googleProvider } from "@/lib/firebase/config";
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, deleteDoc, onSnapshot, collection, updateDoc } from "firebase/firestore";

// ── Default Current User (Before Login) ──────────────────────────────
const DEFAULT_CURRENT_USER: SocialUser = {
    id: "user-self",
    name: "Developer Guest",
    github: "devmatch_guest",
    role: "Frontend",
    skills: ["React", "Three.js", "TailwindCSS"],
    style: "Builder",
    avatar: "G",
    isOnline: true,
};

// ── Seed Data for Fallbacks / Guest Mode ───────────────────────────
const SOCIAL_USERS: SocialUser[] = [
    { id: "user-1", name: "Alex River", github: "ariver_dev", role: "Backend", skills: ["Node.js", "Python", "PostgreSQL", "Redis"], style: "Builder", avatar: "A", isOnline: true },
    { id: "user-2", name: "Sarah Chen", github: "schen_design", role: "Designer", skills: ["Figma", "React", "TailwindCSS", "Framer Motion"], style: "Designer", avatar: "S", isOnline: false },
    { id: "user-3", name: "Marcus Thorne", github: "mthorne_lead", role: "Fullstack", skills: ["React", "Go", "Kubernetes", "AWS"], style: "Thinker", avatar: "M", isOnline: true },
    { id: "user-4", name: "Jasmine Lee", github: "jlee_hustle", role: "Product", skills: ["Strategy", "Market Analysis", "User Research", "Agile"], style: "Hustler", avatar: "J", isOnline: false },
    { id: "user-5", name: "Rahul Verma", github: "rahulv_code", role: "Backend", skills: ["Go", "Docker", "AWS", "MongoDB"], style: "Builder", avatar: "R", isOnline: true },
    { id: "user-6", name: "Priya Nair", github: "priya_ml", role: "Fullstack", skills: ["Python", "TensorFlow", "React", "FastAPI"], style: "Thinker", avatar: "P", isOnline: true },
];

const SEED_FRIENDS: Friend[] = [
    { ...SOCIAL_USERS[0], addedAt: Date.now() - 86400000 },
    { ...SOCIAL_USERS[2], addedAt: Date.now() - 172800000 },
];

const SEED_REQUESTS: FriendRequest[] = [
    { id: "req-1", from: SOCIAL_USERS[4], timestamp: Date.now() - 3600000, status: "pending" },
    { id: "req-2", from: SOCIAL_USERS[5], timestamp: Date.now() - 7200000, status: "pending" },
];

const SEED_NOTIFICATIONS: Notification[] = [
    { id: "notif-1", type: "smart_suggestion", title: "Missing Role Detected", message: "Your team has no DevOps engineer — you're 40% weaker in deployment velocity.", timestamp: Date.now() - 300000, read: false, actionUrl: "/matches" },
    { id: "notif-2", type: "match_found", title: "High Compatibility Alert", message: "You and Alex River have 92% compatibility. Consider teaming up!", timestamp: Date.now() - 600000, read: false, fromUser: SOCIAL_USERS[0], actionUrl: "/matches" },
    { id: "notif-3", type: "hackathon_alert", title: "Deadline Approaching", message: "Web3 DeFi Builder Sprint ends in 5 days. Your team is a great fit!", timestamp: Date.now() - 900000, read: false, actionUrl: "/dashboard" },
    { id: "notif-4", type: "friend_request", title: "Friend Request", message: "Rahul Verma wants to connect with you.", timestamp: Date.now() - 3600000, read: false, fromUser: SOCIAL_USERS[4] },
    { id: "notif-5", type: "smart_suggestion", title: "Skill Match", message: "This hackathon needs ML + React — Priya Nair covers both. Invite her!", timestamp: Date.now() - 5000000, read: true, fromUser: SOCIAL_USERS[5], actionUrl: "/matches" },
];

const SEED_CONVERSATIONS: Conversation[] = [
    {
        id: "conv-1", type: "direct", name: "Alex River",
        participants: [DEFAULT_CURRENT_USER, SOCIAL_USERS[0]],
        lastActivity: Date.now() - 120000,
        messages: [
            { id: "m1", senderId: "user-1", text: "Hey! Saw your Three.js work — insane 🔥", timestamp: Date.now() - 600000 },
            { id: "m2", senderId: "user-self", text: "Thanks! Your Redis setup was clean too", timestamp: Date.now() - 540000 },
            { id: "m3", senderId: "user-1", text: "Down for the Web3 hackathon this weekend?", timestamp: Date.now() - 120000 },
        ],
    },
    {
        id: "conv-team", type: "team", name: "Team Nexus",
        participants: [DEFAULT_CURRENT_USER, SOCIAL_USERS[0], SOCIAL_USERS[1]],
        lastActivity: Date.now() - 300000,
        messages: [
            { id: "tm1", senderId: "user-1", text: "API endpoints are ready 🚀", timestamp: Date.now() - 600000 },
            { id: "tm2", senderId: "user-self", text: "Frontend consuming them now", timestamp: Date.now() - 500000 },
            { id: "tm3", senderId: "user-2", text: "Design system v2 pushed to Figma", timestamp: Date.now() - 300000 },
        ],
    },
];

const SEED_INVITES: TeamInvite[] = [
    { id: "inv-1", from: SOCIAL_USERS[2], teamName: "Team Nexus", timestamp: Date.now() - 1800000, status: "pending" },
];

const SEED_ACTIVITY: ActivityEvent[] = [
    { id: "act-1", type: "team_join", message: "Alex River joined Team Nexus", timestamp: Date.now() - 60000, user: SOCIAL_USERS[0] },
    { id: "act-2", type: "hackathon_new", message: "New hackathon: Global AI Innovation Challenge", timestamp: Date.now() - 300000 },
    { id: "act-3", type: "match_found", message: "3 new matches found for your profile", timestamp: Date.now() - 600000 },
    { id: "act-4", type: "friend_added", message: "Sarah Chen accepted your friend request", timestamp: Date.now() - 900000, user: SOCIAL_USERS[1] },
    { id: "act-5", type: "team_formed", message: "Team Nexus is now complete (3/3 members)", timestamp: Date.now() - 1200000 },
];

// ── Context Type ───────────────────────────────────────────────────
interface SocialContextType extends SocialState {
    currentUser: SocialUser;
    isAuthenticated: boolean;
    isFirebaseConfigured: boolean;
    isAuthModalOpen: boolean;
    setAuthModalOpen: (open: boolean) => void;
    loginWithGoogle: () => Promise<void>;
    loginAsGuest: (name: string, role: string, github?: string) => void;
    logout: () => Promise<void>;

    // Friend actions
    sendFriendRequest: (user: SocialUser) => Promise<void>;
    acceptFriendRequest: (requestId: string) => Promise<void>;
    rejectFriendRequest: (requestId: string) => Promise<void>;
    isFriend: (userId: string) => boolean;
    hasPendingRequest: (userId: string) => boolean;
    
    // Chat actions
    sendMessage: (conversationId: string, text: string) => Promise<void>;
    openChat: (conversationId: string) => void;
    openDirectChat: (userId: string) => Promise<void>;
    closeChat: () => void;
    
    // Notification actions
    markNotificationRead: (id: string) => Promise<void>;
    markAllNotificationsRead: () => Promise<void>;
    dismissNotification: (id: string) => Promise<void>;
    unreadCount: number;
    
    // Team invite actions
    sendTeamInvite: (user: SocialUser) => Promise<void>;
    acceptTeamInvite: (inviteId: string) => Promise<void>;
    rejectTeamInvite: (inviteId: string) => Promise<void>;
    
    // Panel toggles
    toggleFriendsPanel: () => void;
    toggleNotificationPanel: () => void;
    toggleChat: () => void;
    closeAllPanels: () => void;
    
    // Activity
    addActivity: (event: Omit<ActivityEvent, "id" | "timestamp">) => Promise<void>;
    
    // Helpers
    getUserById: (id: string) => SocialUser | undefined;
    pendingFriendRequests: FriendRequest[];
    pendingTeamInvites: TeamInvite[];
    onlineFriendsCount: number;
}

const SocialContext = createContext<SocialContextType | null>(null);

export function useSocial() {
    const ctx = useContext(SocialContext);
    if (!ctx) throw new Error("useSocial must be used within SocialProvider");
    return ctx;
}

// ── Provider ───────────────────────────────────────────────────────
export function SocialProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<SocialUser>(DEFAULT_CURRENT_USER);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);

    // Social Data States
    const [friends, setFriends] = useState<Friend[]>(SEED_FRIENDS);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(SEED_REQUESTS);
    const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);
    const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
    const [teamInvites, setTeamInvites] = useState<TeamInvite[]>(SEED_INVITES);
    const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>(SEED_ACTIVITY);

    // Panel UI States
    const [isFriendsPanelOpen, setFriendsPanelOpen] = useState(false);
    const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    const isFirebaseConfigured = !!auth;
    const idCounter = useRef(100);
    const nextId = useCallback((prefix: string) => `${prefix}-${idCounter.current++}-${Date.now().toString().slice(-4)}`, []);

    // ── LocalStorage Initialization ────────────────────────────────
    useEffect(() => {
        // Load Guest login persistence if any
        const storedUser = localStorage.getItem("devmatch_currentUser");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed && parsed.id) {
                    setCurrentUser(parsed);
                    setIsAuthenticated(true);
                }
            } catch (_) {}
        }

        // Setup seeds in LocalStorage if not present
        const initLocal = (key: string, seed: any, setter: any) => {
            const data = localStorage.getItem(`devmatch_${key}`);
            if (data) {
                try { setter(JSON.parse(data)); } catch (_) {}
            } else {
                localStorage.setItem(`devmatch_${key}`, JSON.stringify(seed));
                setter(seed);
            }
        };

        initLocal("friends", SEED_FRIENDS, setFriends);
        initLocal("friendRequests", SEED_REQUESTS, setFriendRequests);
        initLocal("notifications", SEED_NOTIFICATIONS, setNotifications);
        initLocal("conversations", SEED_CONVERSATIONS, setConversations);
        initLocal("teamInvites", SEED_INVITES, setTeamInvites);
        initLocal("activityFeed", SEED_ACTIVITY, setActivityFeed);
    }, []);

    // ── Firebase Auth Observer ─────────────────────────────────────
    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Determine initials
                const initials = firebaseUser.displayName
                    ? firebaseUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    : (firebaseUser.email?.[0] || "U").toUpperCase();

                const matchedUser: SocialUser = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || "Google Developer",
                    github: firebaseUser.email?.split("@")[0] || "dev",
                    role: "Fullstack",
                    skills: ["React", "TypeScript", "Node.js"],
                    style: "Builder",
                    avatar: initials,
                    isOnline: true,
                };

                // Sync profile details to Firestore
                if (db) {
                    try {
                        const userRef = doc(db, "users", firebaseUser.uid);
                        await setDoc(userRef, matchedUser, { merge: true });
                    } catch (e) {
                        console.error("Failed to sync profile to Firestore:", e);
                    }
                }

                setCurrentUser(matchedUser);
                setIsAuthenticated(true);
                localStorage.setItem("devmatch_currentUser", JSON.stringify(matchedUser));
            } else {
                // If logged out of Firebase and there is no guest token in localStorage, revert to guest
                const storedUser = localStorage.getItem("devmatch_currentUser");
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        if (parsed.id.startsWith("guest-")) {
                            // Retain guest account
                            return;
                        }
                    } catch (_) {}
                }
                
                setCurrentUser(DEFAULT_CURRENT_USER);
                setIsAuthenticated(false);
            }
        });

        return unsubscribe;
    }, [isFirebaseConfigured]);

    // ── Firestore Real-Time Subscriptions ──────────────────────────
    useEffect(() => {
        if (!db || !isAuthenticated || currentUser.id === "user-self" || currentUser.id.startsWith("guest-")) {
            return;
        }

        const handleSnap = (setter: any, key: string, sortFn?: (a: any, b: any) => number) => (snapshot: any) => {
            const list: any[] = [];
            snapshot.forEach((d: any) => list.push(d.data()));
            const sorted = sortFn ? list.sort(sortFn) : list;
            setter(sorted);
            localStorage.setItem(`devmatch_${key}`, JSON.stringify(sorted));
        };

        const unsubFriends = onSnapshot(collection(db, "users", currentUser.id, "friends"), 
            handleSnap(setFriends, "friends"), (e) => console.warn("Friends sync failed:", e));

        const unsubRequests = onSnapshot(collection(db, "users", currentUser.id, "friendRequests"), 
            handleSnap(setFriendRequests, "friendRequests"), (e) => console.warn("Requests sync failed:", e));

        const unsubNotifs = onSnapshot(collection(db, "users", currentUser.id, "notifications"), 
            handleSnap(setNotifications, "notifications", (a, b) => b.timestamp - a.timestamp), (e) => console.warn("Notifs sync failed:", e));

        const unsubConvs = onSnapshot(collection(db, "users", currentUser.id, "conversations"), 
            handleSnap(setConversations, "conversations", (a, b) => b.lastActivity - a.lastActivity), (e) => console.warn("Convs sync failed:", e));

        const unsubInvites = onSnapshot(collection(db, "users", currentUser.id, "teamInvites"), 
            handleSnap(setTeamInvites, "teamInvites"), (e) => console.warn("Invites sync failed:", e));

        const unsubActivity = onSnapshot(collection(db, "users", currentUser.id, "activityFeed"), 
            handleSnap(setActivityFeed, "activityFeed", (a, b) => b.timestamp - a.timestamp), (e) => console.warn("Activity sync failed:", e));

        return () => {
            unsubFriends();
            unsubRequests();
            unsubNotifs();
            unsubConvs();
            unsubInvites();
            unsubActivity();
        };
    }, [isAuthenticated, currentUser?.id]);

    // ── Auth Actions ───────────────────────────────────────────────
    const loginWithGoogle = async () => {
        if (!auth || !googleProvider) {
            throw new Error("Firebase Authentication is not configured.");
        }
        await signInWithPopup(auth, googleProvider);
    };

    const loginAsGuest = (name: string, role: string, github?: string) => {
        const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "G";
        const guestUser: SocialUser = {
            id: `guest-${Date.now()}`,
            name,
            github: github || name.toLowerCase().replace(/\s+/g, ""),
            role,
            skills: role === "Frontend" ? ["React", "Three.js", "TailwindCSS"] : 
                    role === "Backend" ? ["Node.js", "Express", "PostgreSQL"] : 
                    role === "Designer" ? ["Figma", "UI/UX", "Framer Motion"] : 
                    role === "Fullstack" ? ["Next.js", "React", "Node.js", "PostgreSQL"] : ["Agile", "Strategy", "User Research"],
            style: role === "Designer" ? "Designer" : role === "Product" ? "Hustler" : "Builder",
            avatar: initials,
            isOnline: true,
        };
        setCurrentUser(guestUser);
        setIsAuthenticated(true);
        localStorage.setItem("devmatch_currentUser", JSON.stringify(guestUser));
    };

    const logout = async () => {
        if (auth && !currentUser.id.startsWith("guest-")) {
            await firebaseSignOut(auth);
        }
        localStorage.removeItem("devmatch_currentUser");
        setCurrentUser(DEFAULT_CURRENT_USER);
        setIsAuthenticated(false);
        closeAllPanels();
    };

    // ── Helper Mapping ─────────────────────────────────────────────
    const getUserById = useCallback((id: string) => {
        if (id === currentUser.id) return currentUser;
        return SOCIAL_USERS.find(u => u.id === id);
    }, [currentUser]);

    const isFriend = useCallback((userId: string) => friends.some(f => f.id === userId), [friends]);
    const hasPendingRequest = useCallback((userId: string) =>
        friendRequests.some(r => r.from.id === userId && r.status === "pending"), [friendRequests]);

    const pendingFriendRequests = friendRequests.filter(r => r.status === "pending");
    const pendingTeamInvites = teamInvites.filter(i => i.status === "pending");
    const unreadCount = notifications.filter(n => !n.read).length;
    const onlineFriendsCount = friends.filter(f => f.isOnline).length;

    // ── Save State Helper for Local Fallback ────────────────────────
    const saveLocal = (key: string, data: any, setter: any) => {
        setter(data);
        localStorage.setItem(`devmatch_${key}`, JSON.stringify(data));
    };

    // ── Add Activity Helper ────────────────────────────────────────
    const addActivity = useCallback(async (event: Omit<ActivityEvent, "id" | "timestamp">) => {
        const actId = nextId("act");
        const newEvent: ActivityEvent = { ...event, id: actId, timestamp: Date.now() };

        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await setDoc(doc(db, "users", currentUser.id, "activityFeed", actId), newEvent);
            } catch (e) {
                console.error("Firestore activity sync error:", e);
            }
        } else {
            saveLocal("activityFeed", [newEvent, ...activityFeed], setActivityFeed);
        }
    }, [activityFeed, currentUser, isAuthenticated, nextId]);

    // ── Friend Actions ─────────────────────────────────────────────
    const sendFriendRequest = useCallback(async (user: SocialUser) => {
        if (isFriend(user.id) || hasPendingRequest(user.id)) return;
        const reqId = nextId("req");
        
        const request: FriendRequest = {
            id: reqId,
            from: currentUser,
            timestamp: Date.now(),
            status: "pending"
        };

        const notification: Notification = {
            id: nextId("notif"),
            type: "friend_request",
            title: "Friend Request Sent",
            message: `Request sent to ${user.name}`,
            fromUser: user,
            timestamp: Date.now(),
            read: false
        };

        const activity: ActivityEvent = {
            id: nextId("act"),
            type: "invite_sent",
            message: `You sent a friend request to ${user.name}`,
            timestamp: Date.now(),
            user
        };

        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await setDoc(doc(db, "users", user.id, "friendRequests", reqId), request);
                
                const rxNotif: Notification = {
                    id: nextId("notif"),
                    type: "friend_request",
                    title: "Friend Request Received",
                    message: `${currentUser.name} wants to connect with you.`,
                    fromUser: currentUser,
                    timestamp: Date.now(),
                    read: false
                };
                await setDoc(doc(db, "users", user.id, "notifications", rxNotif.id), rxNotif);
                await setDoc(doc(db, "users", currentUser.id, "notifications", notification.id), notification);
                await setDoc(doc(db, "users", currentUser.id, "activityFeed", activity.id), activity);
            } catch (e) {
                console.error("Firestore friend request error:", e);
            }
        } else {
            saveLocal("friendRequests", [...friendRequests, request], setFriendRequests);
            saveLocal("notifications", [notification, ...notifications], setNotifications);
            saveLocal("activityFeed", [activity, ...activityFeed], setActivityFeed);

            // Mock auto-accept after 3 seconds
            setTimeout(() => {
                setFriendRequests(prev => {
                    const updated = prev.map(r => r.id === reqId ? { ...r, status: "accepted" as const } : r);
                    localStorage.setItem("devmatch_friendRequests", JSON.stringify(updated));
                    return updated;
                });
                setFriends(prev => {
                    if (prev.some(f => f.id === user.id)) return prev;
                    const updated = [...prev, { ...user, addedAt: Date.now() }];
                    localStorage.setItem("devmatch_friends", JSON.stringify(updated));
                    return updated;
                });

                const acceptNotif: Notification = {
                    id: nextId("notif"),
                    type: "friend_request",
                    title: "Request Accepted!",
                    message: `${user.name} is now your friend`,
                    fromUser: user,
                    timestamp: Date.now(),
                    read: false
                };
                setNotifications(prev => {
                    const updated = [acceptNotif, ...prev];
                    localStorage.setItem("devmatch_notifications", JSON.stringify(updated));
                    return updated;
                });

                const acceptAct: ActivityEvent = {
                    id: nextId("act"),
                    type: "friend_added",
                    message: `${user.name} accepted your friend request`,
                    timestamp: Date.now(),
                    user
                };
                setActivityFeed(prev => {
                    const updated = [acceptAct, ...prev];
                    localStorage.setItem("devmatch_activityFeed", JSON.stringify(updated));
                    return updated;
                });
            }, 3000);
        }
    }, [friends, friendRequests, notifications, activityFeed, currentUser, isAuthenticated, isFriend, hasPendingRequest, nextId]);

    const acceptFriendRequest = useCallback(async (requestId: string) => {
        const req = friendRequests.find(r => r.id === requestId);
        if (!req) return;

        const newFriendForSelf: Friend = { ...req.from, addedAt: Date.now() };
        const newFriendForOther: Friend = { ...currentUser, addedAt: Date.now() };

        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await setDoc(doc(db, "users", currentUser.id, "friendRequests", requestId), { ...req, status: "accepted" });
                await setDoc(doc(db, "users", currentUser.id, "friends", req.from.id), newFriendForSelf);
                await setDoc(doc(db, "users", req.from.id, "friends", currentUser.id), newFriendForOther);

                const activity: ActivityEvent = {
                    id: nextId("act"),
                    type: "friend_added",
                    message: `You and ${req.from.name} are now friends`,
                    timestamp: Date.now(),
                    user: req.from
                };
                await setDoc(doc(db, "users", currentUser.id, "activityFeed", activity.id), activity);

                const rxNotif: Notification = {
                    id: nextId("notif"),
                    type: "friend_request",
                    title: "Request Accepted!",
                    message: `${currentUser.name} accepted your friend request`,
                    fromUser: currentUser,
                    timestamp: Date.now(),
                    read: false
                };
                await setDoc(doc(db, "users", req.from.id, "notifications", rxNotif.id), rxNotif);
            } catch (e) {
                console.error("Firestore acceptFriendRequest error:", e);
            }
        } else {
            const updatedReqs = friendRequests.map(r => r.id === requestId ? { ...r, status: "accepted" as const } : r);
            saveLocal("friendRequests", updatedReqs, setFriendRequests);

            const updatedFriends = friends.some(f => f.id === req.from.id) ? friends : [...friends, newFriendForSelf];
            saveLocal("friends", updatedFriends, setFriends);

            const updatedActivity = [{
                id: nextId("act"),
                type: "friend_added" as const,
                message: `You and ${req.from.name} are now friends`,
                timestamp: Date.now(),
                user: req.from
            }, ...activityFeed];
            saveLocal("activityFeed", updatedActivity, setActivityFeed);
        }
    }, [friendRequests, friends, activityFeed, currentUser, isAuthenticated, nextId]);

    const rejectFriendRequest = useCallback(async (requestId: string) => {
        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await deleteDoc(doc(db, "users", currentUser.id, "friendRequests", requestId));
            } catch (e) {
                console.error("Firestore rejectFriendRequest error:", e);
            }
        } else {
            saveLocal("friendRequests", friendRequests.filter(r => r.id !== requestId), setFriendRequests);
        }
    }, [friendRequests, currentUser, isAuthenticated]);

    // ── Chat Actions ───────────────────────────────────────────────
    const sendMessage = useCallback(async (conversationId: string, text: string) => {
        if (!text.trim()) return;
        const msg: ChatMessage = {
            id: nextId("msg"),
            senderId: currentUser.id,
            text: text.trim(),
            timestamp: Date.now()
        };

        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                const conv = conversations.find(c => c.id === conversationId);
                if (conv) {
                    const updatedConv: Conversation = {
                        ...conv,
                        messages: [...conv.messages, msg],
                        lastActivity: Date.now()
                    };

                    await Promise.all(
                        conv.participants.map(p =>
                            setDoc(doc(db, "users", p.id, "conversations", conversationId), updatedConv)
                        )
                    );
                }
            } catch (e) {
                console.error("Firestore sendMessage error:", e);
            }
        } else {
            const updated = conversations.map(c =>
                c.id === conversationId
                    ? { ...c, messages: [...c.messages, msg], lastActivity: Date.now() }
                    : c
            );
            saveLocal("conversations", updated, setConversations);

            // Mock Reply Simulation
            setTimeout(() => {
                const conv = conversations.find(c => c.id === conversationId);
                const responder = conv?.participants.find(p => p.id !== currentUser.id);
                if (!responder) return;
                const replies = [
                    "Sounds good! Let's sync up later 🤝",
                    "On it! Pushing changes now 🚀",
                    "Nice work! That looks clean 💎",
                    "Agreed, let's ship this 🔥",
                    "Great idea, I'll add that to the board",
                ];
                const reply: ChatMessage = {
                    id: nextId("msg"),
                    senderId: responder.id,
                    text: replies[Math.floor(Math.random() * replies.length)],
                    timestamp: Date.now(),
                };

                setConversations(prev => {
                    const nextConvs = prev.map(c =>
                        c.id === conversationId
                            ? { ...c, messages: [...c.messages, reply], lastActivity: Date.now() }
                            : c
                    );
                    localStorage.setItem("devmatch_conversations", JSON.stringify(nextConvs));
                    return nextConvs;
                });
            }, 2000 + Math.random() * 1000);
        }
    }, [conversations, currentUser, isAuthenticated, nextId]);

    const openChat = useCallback((conversationId: string) => {
        setActiveChatId(conversationId);
        setChatOpen(true);
        setFriendsPanelOpen(false);
        setNotificationPanelOpen(false);
    }, []);

    const openDirectChat = useCallback(async (userId: string) => {
        let conv = conversations.find(c => c.type === "direct" && c.participants.some(p => p.id === userId));
        if (!conv) {
            const user = getUserById(userId);
            if (!user) return;
            
            const newConvId = nextId("conv");
            const newConv: Conversation = {
                id: newConvId,
                type: "direct",
                name: user.name,
                participants: [currentUser, user],
                messages: [],
                lastActivity: Date.now(),
            };

            if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
                try {
                    await Promise.all([
                        setDoc(doc(db, "users", currentUser.id, "conversations", newConvId), newConv),
                        setDoc(doc(db, "users", user.id, "conversations", newConvId), newConv),
                    ]);
                } catch (e) {
                    console.error("Firestore openDirectChat error:", e);
                }
            } else {
                saveLocal("conversations", [...conversations, newConv], setConversations);
            }
            openChat(newConvId);
        } else {
            openChat(conv.id);
        }
    }, [conversations, currentUser, isAuthenticated, getUserById, nextId, openChat]);

    const closeChat = useCallback(() => {
        setChatOpen(false);
        setActiveChatId(null);
    }, []);

    // ── Notification Actions ───────────────────────────────────────
    const markNotificationRead = useCallback(async (id: string) => {
        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await updateDoc(doc(db, "users", currentUser.id, "notifications", id), { read: true });
            } catch (e) {
                console.error("Firestore markNotificationRead error:", e);
            }
        } else {
            saveLocal("notifications", notifications.map(n => n.id === id ? { ...n, read: true } : n), setNotifications);
        }
    }, [notifications, currentUser, isAuthenticated]);

    const markAllNotificationsRead = useCallback(async () => {
        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                const unread = notifications.filter(n => !n.read);
                await Promise.all(unread.map(n => 
                    updateDoc(doc(db, "users", currentUser.id, "notifications", n.id), { read: true })
                ));
            } catch (e) {
                console.error("Firestore markAllNotificationsRead error:", e);
            }
        } else {
            saveLocal("notifications", notifications.map(n => ({ ...n, read: true })), setNotifications);
        }
    }, [notifications, currentUser, isAuthenticated]);

    const dismissNotification = useCallback(async (id: string) => {
        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await deleteDoc(doc(db, "users", currentUser.id, "notifications", id));
            } catch (e) {
                console.error("Firestore dismissNotification error:", e);
            }
        } else {
            saveLocal("notifications", notifications.filter(n => n.id !== id), setNotifications);
        }
    }, [notifications, currentUser, isAuthenticated]);

    // ── Team Invite Actions ────────────────────────────────────────
    const sendTeamInvite = useCallback(async (user: SocialUser) => {
        if (teamInvites.some(i => i.from.id === user.id && i.status === "pending")) return;
        const invId = nextId("inv");

        const invite: TeamInvite = {
            id: invId,
            from: currentUser,
            teamName: "Team Nexus",
            timestamp: Date.now(),
            status: "pending"
        };

        const notification: Notification = {
            id: nextId("notif"),
            type: "team_invite",
            title: "Team Invite Sent",
            message: `Invited ${user.name} to Team Nexus`,
            fromUser: user,
            timestamp: Date.now(),
            read: false
        };

        const activity: ActivityEvent = {
            id: nextId("act"),
            type: "invite_sent",
            message: `You invited ${user.name} to Team Nexus`,
            timestamp: Date.now(),
            user
        };

        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await setDoc(doc(db, "users", user.id, "teamInvites", invId), invite);
                
                const rxNotif: Notification = {
                    id: nextId("notif"),
                    type: "team_invite",
                    title: "Team Invite Received",
                    message: `${currentUser.name} invited you to join ${invite.teamName}.`,
                    fromUser: currentUser,
                    timestamp: Date.now(),
                    read: false
                };
                await setDoc(doc(db, "users", user.id, "notifications", rxNotif.id), rxNotif);
                await setDoc(doc(db, "users", currentUser.id, "notifications", notification.id), notification);
                await setDoc(doc(db, "users", currentUser.id, "activityFeed", activity.id), activity);
            } catch (e) {
                console.error("Firestore team invite error:", e);
            }
        } else {
            saveLocal("teamInvites", [...teamInvites, invite], setTeamInvites);
            saveLocal("notifications", [notification, ...notifications], setNotifications);
            saveLocal("activityFeed", [activity, ...activityFeed], setActivityFeed);
        }
    }, [teamInvites, notifications, activityFeed, currentUser, isAuthenticated, nextId]);

    const acceptTeamInvite = useCallback(async (inviteId: string) => {
        const inv = teamInvites.find(i => i.id === inviteId);
        if (!inv) return;

        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await setDoc(doc(db, "users", currentUser.id, "teamInvites", inviteId), { ...inv, status: "accepted" });
                
                const activity: ActivityEvent = {
                    id: nextId("act"),
                    type: "team_join",
                    message: `${currentUser.name} joined ${inv.teamName}`,
                    timestamp: Date.now(),
                    user: currentUser
                };
                await setDoc(doc(db, "users", currentUser.id, "activityFeed", activity.id), activity);
                await setDoc(doc(db, "users", inv.from.id, "activityFeed", activity.id), activity);

                const rxNotif: Notification = {
                    id: nextId("notif"),
                    type: "team_invite",
                    title: "Invite Accepted!",
                    message: `${currentUser.name} joined your team`,
                    fromUser: currentUser,
                    timestamp: Date.now(),
                    read: false
                };
                await setDoc(doc(db, "users", inv.from.id, "notifications", rxNotif.id), rxNotif);
            } catch (e) {
                console.error("Firestore acceptTeamInvite error:", e);
            }
        } else {
            saveLocal("teamInvites", teamInvites.map(i => i.id === inviteId ? { ...i, status: "accepted" as const } : i), setTeamInvites);
            
            const updatedActivity = [{
                id: nextId("act"),
                type: "team_join" as const,
                message: `${currentUser.name} joined ${inv.teamName}`,
                timestamp: Date.now(),
                user: currentUser
            }, ...activityFeed];
            saveLocal("activityFeed", updatedActivity, setActivityFeed);

            const updatedNotifs = [{
                id: nextId("notif"),
                type: "team_invite" as const,
                title: "Invite Accepted!",
                message: `${currentUser.name} joined your team`,
                fromUser: currentUser,
                timestamp: Date.now(),
                read: false
            }, ...notifications];
            saveLocal("notifications", updatedNotifs, setNotifications);
        }
    }, [teamInvites, activityFeed, notifications, currentUser, isAuthenticated, nextId]);

    const rejectTeamInvite = useCallback(async (inviteId: string) => {
        if (db && isAuthenticated && !currentUser.id.startsWith("guest-")) {
            try {
                await deleteDoc(doc(db, "users", currentUser.id, "teamInvites", inviteId));
            } catch (e) {
                console.error("Firestore rejectTeamInvite error:", e);
            }
        } else {
            saveLocal("teamInvites", teamInvites.map(i => i.id === inviteId ? { ...i, status: "rejected" as const } : i), setTeamInvites);
        }
    }, [teamInvites, currentUser, isAuthenticated]);

    // ── Panel Toggle Actions ───────────────────────────────────────
    const toggleFriendsPanel = useCallback(() => {
        setFriendsPanelOpen(prev => !prev);
        setNotificationPanelOpen(false);
        setChatOpen(false);
    }, []);

    const toggleNotificationPanel = useCallback(() => {
        setNotificationPanelOpen(prev => !prev);
        setFriendsPanelOpen(false);
    }, []);

    const toggleChat = useCallback(() => {
        setChatOpen(prev => !prev);
        setFriendsPanelOpen(false);
        setNotificationPanelOpen(false);
    }, []);

    const closeAllPanels = useCallback(() => {
        setFriendsPanelOpen(false);
        setNotificationPanelOpen(false);
        setChatOpen(false);
        setActiveChatId(null);
    }, []);

    const value: SocialContextType = {
        currentUser,
        isAuthenticated,
        isFirebaseConfigured,
        isAuthModalOpen,
        setAuthModalOpen,
        loginWithGoogle,
        loginAsGuest,
        logout,
        friends, friendRequests, notifications, conversations, teamInvites, activityFeed,
        isFriendsPanelOpen, isNotificationPanelOpen, isChatOpen, activeChatId,
        // Friend
        sendFriendRequest, acceptFriendRequest, rejectFriendRequest, isFriend, hasPendingRequest,
        // Chat
        sendMessage, openChat, openDirectChat, closeChat,
        // Notification
        markNotificationRead, markAllNotificationsRead, dismissNotification, unreadCount,
        // Team
        sendTeamInvite, acceptTeamInvite, rejectTeamInvite,
        // Panels
        toggleFriendsPanel, toggleNotificationPanel, toggleChat, closeAllPanels,
        // Helpers
        addActivity, getUserById, pendingFriendRequests, pendingTeamInvites, onlineFriendsCount,
    };

    return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}
