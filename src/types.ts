export type HubCategory = 'anime' | 'movie_series' | 'games' | 'wallpapers' | 'music' | 'document' | 'mature';

export interface ChannelInfo {
  id: string;
  name: string;
  category?: HubCategory;
  description?: string;
  isCustom?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'update' | 'maintenance' | 'announcement' | 'content';
  createdAt: number;
}

export interface UserFeedback {
  id: string;
  userId: string;
  userEmail?: string;
  type: 'request' | 'report';
  title: string;
  details: string;
  status: 'pending' | 'fulfilled' | 'rejected' | 'investigating' | 'resolved';
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  createdAt: number;
  lastLoginAt?: number;
  isBanned?: boolean;
  banReason?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userEmail?: string;
  type: string;
  details?: string;
  targetTitle?: string;
  timestamp: number;
}

export interface AdminSecurityAlert {
  id: string;
  targetEmail: string;
  targetUid?: string;
  attemptsCount: number;
  reason: string;
  timestamp: number;
  status: 'active' | 'resolved';
}
