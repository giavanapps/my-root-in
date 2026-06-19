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

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

const getMorningNotificationBody = (categories: string[]): string => {
  const cats = categories.map(c => c.toLowerCase().trim());
  
  if (cats.some(c => c.includes("bain d'huile") || c.includes("bain d’huile") || c.includes("masque"))) {
    return "🌿 Le rituel du jour : Aujourd'hui, on répare et on nourrit en profondeur. C'est parti pour ta session soin ?";
  }
  if (cats.some(c => c.includes("clarification") || c.includes("lavage") || c.includes("shampoing") || c.includes("shampoo") || c.includes("detox") || c.includes("détox"))) {
    return "🫧 Détox capillaire : On libère tes cheveux de tous les résidus aujourd'hui. C'est parti !";
  }
  if (cats.some(c => c.includes("retwist") || c.includes("coiffage") || c.includes("coupe") || c.includes("dusting"))) {
    return "👑 Alerte fraîcheur : On s'occupe de tes racines et de ta définition aujourd'hui. On lance le chrono ?";
  }
  if (cats.some(c => c.includes("sans rinçage") || c.includes("sans rincage") || c.includes("leave") || c.includes("vapo") || c.includes("hydratation") || c.includes("lait") || c.includes("crème") || c.includes("creme"))) {
    return "🌊 Un petit coup de boost pour tes cheveux ? 2 minutes pour hydrater et c'est plié !";
  }
  if (cats.some(c => c.includes("massage"))) {
    return "💆‍♀️ Détente absolue : C'est l'heure de ton massage crânien pour stimuler la pousse. C'est le moment de se relaxer ?";
  }
  if (cats.some(c => c.includes("porosité") || c.includes("porosite") || c.includes("test"))) {
    return "🔬 Test de porosité : Découvre la porosité de tes cheveux aujourd'hui pour adapter tes soins. C'est simple et rapide !";
  }
  return "💆‍♀️ My Root'In : C'est ton moment bien-être capillaire aujourd'hui !";
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
   * Groups cares by date to send a single dynamic morning alert per scheduled day.
   */
  async scheduleDailyCareReminders(
    timeStr: string,
    routineItems: RoutineItem[],
    profileName: string,
    tone: 'Doux' | 'Motivant' | 'Direct'
  ): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      // 1. Configurer le canal de notification Android avec haute importance et le son du vaporisateur
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('my-root-in-reminders-v4', {
          name: 'Rappels de soins Root\'In',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E5A982', // Couleur Terracotta
          showBadge: true,
          sound: 'two_pshit.mp3',
        });
      }

      // 2. Wipe previous alarms to avoid duplication
      await this.cancelAllReminders();

      const todayStr = getLocalDateString();

      // 3. Filter uncompleted cares scheduled for today or in the future
      const upcomingCares = routineItems.filter(
        item => !item.completed && item.date >= todayStr
      );

      // Group cares by date
      const caresByDate: { [date: string]: RoutineItem[] } = {};
      for (const item of upcomingCares) {
        if (!caresByDate[item.date]) {
          caresByDate[item.date] = [];
        }
        caresByDate[item.date].push(item);
      }

      const sortedDates = Object.keys(caresByDate).sort();

      // 4. Register native notifications up to a safe limit (Android/iOS supports ~64 scheduled tasks max)
      const maxDays = Math.min(sortedDates.length, 30);

      for (let i = 0; i < maxDays; i++) {
        const dateStr = sortedDates[i];
        const dayCares = caresByDate[dateStr];
        
        // Parse scheduled calendar date e.g. "YYYY-MM-DD"
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Use custom reminderTime of the first item with override if defined, otherwise fall back to global default
        let itemTime = timeStr;
        for (const care of dayCares) {
          if (care.reminderTime) {
            itemTime = care.reminderTime;
            break;
          }
        }
        const [itemHour, itemMinute] = itemTime.split(':').map(Number);

        if (isNaN(itemHour) || isNaN(itemMinute)) continue;
        
        // Trigger at custom time on that scheduled date
        // Note: Months in Javascript are 0-indexed (0 = January)
        const triggerDate = new Date(year, month - 1, day, itemHour, itemMinute, 0);

        if (triggerDate.getTime() > Date.now()) {
          const categories = dayCares.map(c => c.category);
          const bodyText = getMorningNotificationBody(categories);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "My Root'In 🌿",
              body: bodyText,
              sound: 'two_pshit.mp3',
              priority: Notifications.AndroidNotificationPriority.MAX,
              data: {
                isMorningNotification: true,
                date: dateStr,
                routineIds: dayCares.map(c => c.id)
              },
            },
            trigger: { 
              type: Notifications.SchedulableTriggerInputTypes.DATE, 
              date: triggerDate,
              channelId: 'my-root-in-reminders-v4',
            },
          });
        }
      }
      
      console.log(`Successfully scheduled ${maxDays} morning reminders`);
    } catch (e) {
      console.warn('Error scheduling reminders:', e);
    }
  }
};
