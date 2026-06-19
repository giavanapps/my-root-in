// Platform-specific web mock of NotificationService.
// This file avoids importing expo-notifications entirely to prevent browser evaluation crashes.

export interface RoutineItem {
  id: string;
  profileId: string;
  category: string;
  product: string;
  recurrence: string;
  date: string;
  completed: boolean;
  reminderTime?: string;
  isCustom?: boolean;
  selectedProductId?: string;
}

export const NotificationService = {
  /**
   * Checks simulated permissions on web (defaults to granted)
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
    return 'granted';
  },

  /**
   * Requests simulated permissions on web (defaults to granted)
   */
  async requestPermissions(): Promise<'granted' | 'denied'> {
    return 'granted';
  },

  /**
   * No-op cancel for Web browser
   */
  async cancelAllReminders(): Promise<void> {
    console.log('[Web NotificationService] cancelAllReminders called (no-op)');
  },

  /**
   * No-op scheduling for Web browser
   */
  async scheduleDailyCareReminders(
    timeStr: string,
    routineItems: RoutineItem[],
    profileName: string,
    tone: 'Doux' | 'Motivant' | 'Direct'
  ): Promise<void> {
    console.log(`[Web NotificationService] scheduleDailyCareReminders called at ${timeStr} for ${profileName} with tone ${tone} (no-op)`);
  }
};
