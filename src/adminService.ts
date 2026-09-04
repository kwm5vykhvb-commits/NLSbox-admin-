import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ChannelInfo,
  AppNotification,
  UserFeedback,
  UserProfile,
  UserActivity,
  AdminSecurityAlert,
  HubCategory,
} from './types';

export const SUPER_ADMIN_EMAILS = [
  'leamsinls@gmail.com',
  'mongalardaqui@gmail.com',
  'nlsmusic.cd@gmail.com',
];

export class AdminService {
  // --- GESTION DES CANAUX & CONFIGURATION SYSTEME ---
  static subscribeToChannels(callback: (channels: ChannelInfo[], config: any) => void) {
    const docRef = doc(db, 'systemConfig', 'channels');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.channels || [], data);
      } else {
        callback([], {});
      }
    });
  }

  static async saveChannelsConfig(channels: ChannelInfo[], primaryMap: any, multiMap: any, backupMap: any) {
    const docRef = doc(db, 'systemConfig', 'channels');
    await setDoc(docRef, {
      channels,
      primaryChannelsByCategory: primaryMap,
      multiChannelsByCategory: multiMap,
      backupChannelsByCategory: backupMap,
      updatedAt: Date.now(),
    }, { merge: true });
  }

  static async updateExtendedModule(enabled: boolean, pin: string) {
    const docRef = doc(db, 'systemConfig', 'channels');
    await setDoc(docRef, {
      extendedModuleEnabled: enabled,
      extendedModulePin: pin,
      updatedAt: Date.now(),
    }, { merge: true });
  }

  // --- NOTIFICATIONS PUSH GLOBALES ---
  static subscribeToNotifications(callback: (notifs: AppNotification[]) => void) {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as AppNotification[];
      callback(list);
    });
  }

  static async createNotification(title: string, message: string, type: AppNotification['type']) {
    const docRef = doc(collection(db, 'notifications'));
    await setDoc(docRef, {
      title,
      message,
      type,
      createdAt: Date.now(),
    });
  }

  static async deleteNotification(id: string) {
    await deleteDoc(doc(db, 'notifications', id));
  }

  // --- DEMANDES & SIGNALEMENTS (FEEDBACK) ---
  static subscribeToFeedback(callback: (items: UserFeedback[]) => void) {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as UserFeedback[];
      callback(list);
    });
  }

  static async updateFeedbackStatus(id: string, status: UserFeedback['status']) {
    await updateDoc(doc(db, 'feedback', id), { status, updatedAt: Date.now() });
  }

  static async deleteFeedback(id: string) {
    await deleteDoc(doc(db, 'feedback', id));
  }

  // --- UTILISATEURS & MODERATION ---
  static async fetchAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserProfile[];
  }

  static async banUser(uid: string, reason: string) {
    await updateDoc(doc(db, 'users', uid), {
      isBanned: true,
      banReason: reason,
      bannedAt: Date.now(),
    });
  }

  static async unbanUser(uid: string) {
    await updateDoc(doc(db, 'users', uid), {
      isBanned: false,
      banReason: '',
      unbannedAt: Date.now(),
    });
  }

  static async fetchUserActivities(uid: string): Promise<UserActivity[]> {
    const snap = await getDocs(collection(db, 'userActivities'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a: any) => a.userId === uid)
      .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)) as UserActivity[];
  }

  // --- SECURITE & ALERTES D'INTRUSION ---
  static subscribeToSecurityAlerts(callback: (alerts: AdminSecurityAlert[]) => void) {
    const q = query(collection(db, 'adminSecurityAlerts'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as AdminSecurityAlert[];
      callback(list);
    });
  }

  static async resolveSecurityAlert(alertId: string) {
    await updateDoc(doc(db, 'adminSecurityAlerts', alertId), { status: 'resolved' });
  }
}
