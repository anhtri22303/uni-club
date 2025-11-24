"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";
import { usePathname } from "next/navigation";
import { safeLocalStorage, safeSessionStorage } from "@/lib/browser-utils";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface NotificationSettings {
  enabled: boolean;
  lastSeen: { [clubId: number]: number };
}

interface UnreadCount {
  clubId: number;
  count: number;
}

interface NotificationContextType {
  enabled: boolean;
  toggleNotifications: () => void;
  unreadCounts: UnreadCount[];
  totalUnread: number;
  markClubAsSeen: (clubId: number) => void;
  refreshUnreadCounts: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = "clubly-notification-settings";
const POLL_INTERVAL = 2000; // 2 seconds, same as chat pages

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { auth, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [lastSeen, setLastSeen] = useState<{ [clubId: number]: number }>({});
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([]);
  const [clubIds, setClubIds] = useState<number[]>([]);
  const [lastNotifiedMessages, setLastNotifiedMessages] = useState<Set<string>>(new Set());

  // Initialize from localStorage
  useEffect(() => {
    if (!isAuthenticated) return;

    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const settings: NotificationSettings = JSON.parse(stored);
        setEnabled(settings.enabled || false);
        setLastSeen(settings.lastSeen || {});
      } catch (err) {
        console.warn("Failed to parse notification settings", err);
      }
    }
  }, [isAuthenticated]);

  // Get user's club IDs
  useEffect(() => {
    if (!isAuthenticated || !auth.role) return;

    const getClubIds = () => {
      const authData = safeSessionStorage.getItem("uniclub-auth");
      if (!authData) return [];

      try {
        const parsed = JSON.parse(authData);
        
        if (auth.role === "student") {
          // Student can have multiple clubs
          return parsed.clubIds || (parsed.clubId ? [parsed.clubId] : []);
        } else if (auth.role === "club_leader") {
          // Club leader has single club
          return parsed.clubId ? [parsed.clubId] : [];
        }
      } catch (err) {
        console.warn("Failed to get club IDs", err);
      }
      return [];
    };

    const ids = getClubIds();
    setClubIds(ids);

    // Initialize lastSeen for new clubs
    setLastSeen(prev => {
      const updated = { ...prev };
      ids.forEach((id: number) => {
        if (!(id in updated)) {
          updated[id] = Date.now();
        }
      });
      return updated;
    });
  }, [isAuthenticated, auth.role]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isAuthenticated) return;

    const settings: NotificationSettings = {
      enabled,
      lastSeen,
    };
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [enabled, lastSeen, isAuthenticated]);

  // Fetch unread messages for a club
  const fetchUnreadForClub = useCallback(async (clubId: number): Promise<number> => {
    try {
      const lastSeenTimestamp = lastSeen[clubId] || 0;
      const response = await axios.get<{ messages: any[]; latestTimestamp: number }>(`/api/chat/poll`, {
        params: {
          clubId,
          after: lastSeenTimestamp,
        },
      });

      const newMessages = response.data.messages || [];
      
      // Filter out messages sent by the current user
      const currentUserId = auth.userId;
      const unreadMessages = newMessages.filter((msg: any) => msg.userId !== currentUserId);
      
      // Show toast for new messages if not on chat page
      const isOnChatPage = pathname?.includes('/chat');
      
      if (!isOnChatPage && unreadMessages.length > 0) {
        // Show toast for the latest message only
        const latestMessage = unreadMessages[unreadMessages.length - 1];
        const messageId = latestMessage.id;
        
        // Only show toast if we haven't notified about this message yet
        if (!lastNotifiedMessages.has(messageId)) {
          setLastNotifiedMessages(prev => new Set(prev).add(messageId));
          
          // Truncate long messages
          const messageText = latestMessage.message?.length > 100 
            ? latestMessage.message.substring(0, 100) + '...'
            : latestMessage.message;
          
          toast({
            title: `💬 New message from ${latestMessage.userName}`,
            description: messageText,
            duration: 3000,
          });
        }
      }
      
      return unreadMessages.length;
    } catch (err) {
      console.error(`Failed to fetch messages for club ${clubId}:`, err);
      return 0;
    }
  }, [lastSeen, auth.userId, pathname, lastNotifiedMessages, toast]);

  // Refresh unread counts for all clubs
  const refreshUnreadCounts = useCallback(async () => {
    if (!enabled || clubIds.length === 0) {
      setUnreadCounts([]);
      return;
    }

    try {
      const counts = await Promise.all(
        clubIds.map(async (clubId) => {
          const count = await fetchUnreadForClub(clubId);
          return { clubId, count };
        })
      );

      setUnreadCounts(counts.filter(c => c.count > 0));
    } catch (err) {
      console.error("Failed to refresh unread counts:", err);
    }
  }, [enabled, clubIds, fetchUnreadForClub]);

  // Background polling when enabled
  useEffect(() => {
    if (!enabled || !isAuthenticated || clubIds.length === 0) {
      setUnreadCounts([]);
      return;
    }

    // Initial fetch
    refreshUnreadCounts();

    // Set up polling interval
    const interval = setInterval(() => {
      refreshUnreadCounts();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [enabled, isAuthenticated, clubIds, refreshUnreadCounts]);

  // Toggle notifications on/off
  const toggleNotifications = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  // Mark a club as seen (update lastSeen timestamp)
  const markClubAsSeen = useCallback((clubId: number) => {
    const now = Date.now();
    setLastSeen(prev => ({
      ...prev,
      [clubId]: now,
    }));

    // Immediately update unread counts
    setUnreadCounts(prev => prev.filter(c => c.clubId !== clubId));
    
    // Clear notified messages for this club (optional, helps reduce memory)
    // We keep the set to prevent re-showing toasts for old messages
  }, []);

  // Calculate total unread
  const totalUnread = unreadCounts.reduce((sum, c) => sum + c.count, 0);

  const value: NotificationContextType = {
    enabled,
    toggleNotifications,
    unreadCounts,
    totalUnread,
    markClubAsSeen,
    refreshUnreadCounts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
