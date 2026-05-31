import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure the default notification handler behavior on native devices
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface RoutineItem {
  id: string;
  profileId: string;
  category: string;
  product: string;
  recurrence: string;
  date: string;
  completed: boolean;
  reminderTime?: string;
}

const getNotificationBody = (name: string, category: string, tone: 'Doux' | 'Motivant' | 'Direct'): string => {
  const cleanName = name.split(' ')[0]; // only use first name
  if (tone === 'Doux') {
    return `Bonjour ${cleanName} ! C'est le moment de chouchouter tes cheveux : ton soin ${category} t'attend. Prends ce doux moment pour toi 🌿`;
  }
  if (tone === 'Motivant') {
    return `Aujourd'hui on ne lâche rien, ${cleanName} ! Ton soin ${category} est prévu. Tes boucles vont adorer, let's go ! 💪`;
  }
  // Default to 'Direct'
  return `Rappel : Soin ${category} à réaliser aujourd'hui. Ouvre ton guide d'étapes sur l'application.`;
};

export const NotificationService = {
  /**
   * Checks the current native notification permissions state
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
    if (Platform.OS === 'web') {
      return 'granted'; // Web simulation defaults to granted
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status as 'granted' | 'denied' | 'undetermined';
    } catch (e) {
      console.warn('Error checking permissions:', e);
      return 'undetermined';
    }
  },

  /**
   * Requests native OS notification permissions
   */
  async requestPermissions(): Promise<'granted' | 'denied'> {
    if (Platform.OS === 'web') {
      return 'granted';
    }
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowSound: true,
          allowBadge: true,
        },
      });
      return status === 'granted' ? 'granted' : 'denied';
    } catch (e) {
      console.warn('Error requesting permissions:', e);
      return 'denied';
    }
  },

  /**
   * Wipes all scheduled local alerts
   */
  async cancelAllReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('Error cancelling notifications:', e);
    }
  },

  /**
   * Schedules push notifications for upcoming cares in the routine calendar
   */
  async scheduleDailyCareReminders(
    timeStr: string,
    routineItems: RoutineItem[],
    profileName: string,
    tone: 'Doux' | 'Motivant' | 'Direct'
  ): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      // 1. Configurer le canal de notification Android avec haute importance pour jouer du son
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Rappels de soins',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E5A982', // Couleur Terracotta
          showBadge: true,
          sound: 'default', // utilise le son par défaut
        });
      }

      // 2. Wipe previous alarms to avoid duplication
      await this.cancelAllReminders();

      const todayStr = new Date().toISOString().split('T')[0];

      // 3. Filter uncompleted cares scheduled for today or in the future
      const upcomingCares = routineItems.filter(
        item => !item.completed && item.date >= todayStr
      );

      // 4. Register native notifications up to a safe limit (Android/iOS supports ~64 scheduled tasks max)
      const maxReminders = Math.min(upcomingCares.length, 30);

      for (let i = 0; i < maxReminders; i++) {
        const item = upcomingCares[i];
        
        // Parse scheduled calendar date e.g. "YYYY-MM-DD"
        const [year, month, day] = item.date.split('-').map(Number);
        
        // Use custom reminderTime if defined, otherwise fall back to global default
        const itemTime = item.reminderTime || timeStr;
        const [itemHour, itemMinute] = itemTime.split(':').map(Number);

        if (isNaN(itemHour) || isNaN(itemMinute)) continue;
        
        // Trigger at custom time on that scheduled date
        // Note: Months in Javascript are 0-indexed (0 = January)
        const triggerDate = new Date(year, month - 1, day, itemHour, itemMinute, 0);

        if (triggerDate.getTime() > Date.now()) {
          const secondsFromNow = Math.max(1, Math.round((triggerDate.getTime() - Date.now()) / 1000));
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "My Root'In 🌿 Rappel de Soin",
              body: getNotificationBody(profileName, item.category, tone),
              sound: true,
              data: { routineId: item.id, category: item.category },
            },
            trigger: { 
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
              seconds: secondsFromNow,
              channelId: 'default' // obligatoire pour le son sur Android 8+
            },
          });
        }
      }
      
      console.log(`Successfully scheduled ${maxReminders} native reminders with individual time overrides`);
    } catch (e) {
      console.warn('Error scheduling reminders:', e);
    }
  }
};
