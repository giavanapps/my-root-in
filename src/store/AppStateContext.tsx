import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationService } from './NotificationService';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Types
export interface HairDiagnostic {
  texture: 'Ondulés' | 'Bouclés' | 'Frisés' | 'Crépus' | 'Locksés' | 'Raides';
  porosity: 'Faible' | 'Moyenne' | 'Forte' | null;
  thickness: 'Fins' | 'Moyens' | 'Épais';
  sensitivity: ('Cuir chevelu sensible' | 'Casse/Fourches' | 'Naturels' | 'Traités chimiquement')[];
  activeStyle: 'Naturel' | 'Coiffure protectrice' | 'Locks en évolution';
}

export interface HairHistory {
  lastWash: 'hier' | '3-5_jours' | 'plus_une_semaine' | 'ne_sais_plus';
  recentOil: 'cette_semaine' | '2_semaines' | 'pas_recent';
  recentMask: 'cette_semaine' | '2_semaines' | 'pas_recent';
  currentFeeling: 'secs' | 'equilibres' | 'lourds';
}


export interface ProfileNotifications {
  enabled: boolean;
  time: string; // "HH:MM"
  tone: 'Doux' | 'Motivant' | 'Direct';
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  diagnostic: HairDiagnostic;
  healthScore: number; // 0 - 100
  hydration: number; // 0 - 100
  nutrition: number; // 0 - 100
  scalp: number; // 0 - 100
  notifications: ProfileNotifications;
  createdAt?: string; // "YYYY-MM-DD"
}

export interface ActionLog {
  id: string;
  profileId: string;
  date: string; // YYYY-MM-DD
  category: string; // 'Lavage' | 'Bain d'huile' | etc.
  feedback?: 'Secs' | 'Top' | 'Lourds';
  completed: boolean;
}

export interface RoutineItem {
  id: string;
  profileId: string;
  category: string;
  product: string;
  recurrence: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  isPastOverdue?: boolean;
  enableNotificationReminder?: boolean;
  reminderTime?: string; // "HH:MM"
}

interface AppStateContextType {
  profiles: Profile[];
  activeProfileId: string;
  activeProfile: Profile | undefined;
  routine: RoutineItem[];
  logs: ActionLog[];
  showFeedbackQuiz: boolean;
  catchUpTask: RoutineItem | null;
  themeMode: 'dark' | 'light';
  masterEmail: string;
  isLoading: boolean;
  lastValidatedCare: { category: string; date: string } | null;
  lastFeedbackDelta: number;
  lastFeedbackReason: string;
  showCareSummary: boolean;
  regularityScore: number;
  isPremium: boolean;
  setPremiumStatus: (status: boolean) => void;
  addProfile: (
    name: string,
    diagnostic: HairDiagnostic,
    avatar: string,
    notificationsEnabled?: boolean,
    tone?: 'Doux' | 'Motivant' | 'Direct',
    history?: HairHistory
  ) => void;
  selectProfile: (id: string) => void;
  completeTodayAction: (category: string) => void;
  submitFeedback: (feedback: 'Secs' | 'Top' | 'Lourds') => void;
  closeFeedbackQuiz: () => void;
  closeCareSummary: () => void;
  handleCatchUp: (completed: boolean) => void;
  triggerSosBooster: () => void;
  updateDiagnostic: (diagnostic: HairDiagnostic) => void;
  addCustomRoutineItem: (category: string, product: string, date: string, enableNotification?: boolean, reminderTime?: string) => void;
  completePorosity: (porosity: 'Faible' | 'Moyenne' | 'Forte') => void;
  toggleRoutineCompleted: (id: string) => void;
  deleteRoutineItem: (id: string) => void;
  updateRoutineItemTime: (id: string, time: string) => void;
  
  // Settings & Profile Management Methods
  renameProfile: (id: string, newName: string) => void;
  changeAvatar: (id: string, newAvatar: string) => void;
  deleteProfile: (id: string) => void;
  setPrimaryProfile: (id: string) => void;
  updateNotificationsSetting: (enabled: boolean, time: string, tone: ProfileNotifications['tone']) => void;
  toggleThemeMode: () => void;
  updateMasterAccount: (email: string, pass: string) => void;
  deleteMasterAccount: (onComplete: () => void) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within an AppStateProvider');
  return context;
};

const uuid = () => Math.random().toString(36).substring(2, 9);

const getHairCareColumn = (diagnostic: HairDiagnostic): 'naturel' | 'chimique' | 'locks' | 'crepus' | 'raides' => {
  if (diagnostic.texture === 'Locksés') {
    return 'locks';
  }
  if (diagnostic.texture === 'Raides') {
    return 'raides';
  }
  if (diagnostic.sensitivity.includes('Traités chimiquement')) {
    return 'chimique';
  }
  if (diagnostic.texture === 'Crépus') {
    return 'crepus';
  }
  return 'naturel';
};

const getProductForTask = (category: string, column: 'naturel' | 'chimique' | 'locks' | 'crepus' | 'raides'): string => {
  if (category === 'Lavage') {
    if (column === 'raides') return 'Shampoing Léger Sébo-Régulateur (sébum voyage vite)';
    if (column === 'locks') return 'Shampoing clarifiant sans résidus';
    return 'Shampoing Doux Hydratant Capillaire';
  }
  if (category === 'Bain d\'huile') {
    if (column === 'raides') return 'Huile Légère de Jojoba (soin mensuel très léger)';
    return 'Huile de Coco, Avocat & Ricin (soin riche)';
  }
  if (category === 'Masque hydratant') {
    if (column === 'raides') return 'Gel d\'Aloe Vera Purifié (hydratation mensuelle ultra-légère)';
    return 'Masque Nourrissant au Beurre de Karité & Miel';
  }
  if (category === 'Soin sans rinçage') {
    if (column === 'raides') return 'Spray Hydratant Léger aux Protéines de Soie';
    return 'Lait Capillaire Hydratant à l\'Hibiscus';
  }
  if (category === 'Clarification') {
    return 'Soin détox à l\'Argile Bentonite naturelle';
  }
  if (category === 'Retwist') {
    return 'Gel d\'Aloe Vera Bio & Cire d\'abeille';
  }
  if (category === 'Coupe/Dusting') {
    return 'Ciseaux de coiffure professionnels (retirer pointes abîmées)';
  }
  return 'Soin protecteur signature';
};

const generateRoutineCalendar = (profileId: string, diagnostic: HairDiagnostic, history?: HairHistory): RoutineItem[] => {
  const column = getHairCareColumn(diagnostic);
  const items: RoutineItem[] = [];
  const todayMs = Date.now();

  // Frequencies (in days)
  let lavageInterval = 7;
  let hasBainDhuile = true;
  let bainInterval = 7;
  let hasMasque = true;
  let masqueInterval = 7;
  let hasRetwist = false;
  let retwistInterval = 28;
  let clarificationInterval = 30;
  let dustingInterval = 90;

  // 1. Column configuration
  if (column === 'naturel') {
    lavageInterval = 7;
    bainInterval = 7;
    masqueInterval = 7;
    dustingInterval = 90;
  } else if (column === 'chimique') {
    lavageInterval = 10;
    bainInterval = 4;
    masqueInterval = 4;
    dustingInterval = 42;
  } else if (column === 'locks') {
    lavageInterval = 14;
    bainInterval = 7;
    masqueInterval = 14;
    hasRetwist = true;
    retwistInterval = 28;
    dustingInterval = 999999;
  } else if (column === 'crepus') {
    lavageInterval = 10;
    bainInterval = 4;
    masqueInterval = 7;
    dustingInterval = 90;
  } else if (column === 'raides') {
    lavageInterval = 3;
    bainInterval = 30;
    masqueInterval = 30;
    dustingInterval = 105;
  }

  // 2. Porosity adjustments
  if (diagnostic.porosity === 'Faible') {
    lavageInterval = Math.round(lavageInterval * 1.3);
  } else if (diagnostic.porosity === 'Forte') {
    masqueInterval = Math.max(3, Math.round(masqueInterval * 0.7));
  }

  // Default offsets (starting values)
  let lavageOffset = 0;
  let bainOffset = (column === 'raides' ? 15 : 3);
  let masqueOffset = 0;

  // Apply history offsets dynamically
  if (history) {
    // 1. Wash history
    if (history.lastWash === 'hier') {
      lavageOffset = lavageInterval - 1;
      masqueOffset = masqueInterval - 1;
    } else if (history.lastWash === '3-5_jours') {
      lavageOffset = Math.max(1, lavageInterval - 4);
      masqueOffset = Math.max(1, masqueInterval - 4);
    } else if (history.lastWash === 'plus_une_semaine') {
      lavageOffset = 0;
      masqueOffset = 0;
    } else {
      lavageOffset = 0;
      masqueOffset = 0;
    }

    // 2. Oil history & feeling
    if (history.currentFeeling === 'secs' && history.recentOil === 'pas_recent') {
      // Prioritize Bain d'huile today, or tomorrow if they washed yesterday
      bainOffset = (history.lastWash === 'hier') ? 1 : 0;
    } else if (history.recentOil === 'cette_semaine') {
      bainOffset = bainInterval;
    } else if (history.recentOil === '2_semaines') {
      bainOffset = Math.max(1, bainInterval - 7);
    } else {
      bainOffset = (column === 'raides' ? 15 : 3);
    }

    // 3. Mask history override (if not already overridden by Wash)
    if (history.lastWash !== 'hier' && history.lastWash !== 'plus_une_semaine') {
      if (history.recentMask === 'cette_semaine') {
        masqueOffset = masqueInterval;
      } else if (history.recentMask === '2_semaines') {
        masqueOffset = Math.max(1, masqueInterval - 7);
      }
    }
  }

  // 3. Loop over 30 days
  for (let day = 0; day < 30; day++) {
    const dateStr = new Date(todayMs + (day + 1) * 86400000).toISOString().split('T')[0];
    const dayTasks: { category: string; product?: string; recurrence: string }[] = [];

    if (day === 0 || day === 30) {
      dayTasks.push({ category: 'Clarification', recurrence: 'Mensuel' });
    }

    // Gentle starting soin sans rinçage if they washed yesterday
    if (day === 0 && history?.lastWash === 'hier') {
      dayTasks.push({ category: 'Soin sans rinçage', product: getProductForTask('Soin sans rinçage', column), recurrence: 'Hydratation de départ' });
    }

    // Wash day logic (with offset)
    const isWashDay = (day - lavageOffset) % lavageInterval === 0 && (day - lavageOffset) >= 0;
    if (isWashDay) {
      dayTasks.push({ category: 'Lavage', recurrence: `Tous les ${lavageInterval} jours` });
      dayTasks.push({ category: 'Soin sans rinçage', recurrence: 'Après chaque lavage' });
    }

    // Bain d'huile logic (with offset)
    if (hasBainDhuile) {
      const isBainDay = (day - bainOffset) % bainInterval === 0 && (day - bainOffset) >= 0;
      if (isBainDay) {
        dayTasks.push({ category: 'Bain d\'huile', recurrence: `Tous les ${bainInterval} jours` });
      }
    }

    // Masque logic (with offset)
    if (hasMasque) {
      const isMasqueDay = column === 'raides' 
        ? (day === 5) 
        : ((day - masqueOffset) % masqueInterval === 0 && (day - masqueOffset) >= 0);
      if (isMasqueDay) {
        dayTasks.push({ category: 'Masque hydratant', recurrence: `Tous les ${masqueInterval} jours` });
      }
    }

    if (hasRetwist && day % retwistInterval === 7) {
      dayTasks.push({ category: 'Retwist', recurrence: 'Toutes les 4 semaines' });
    }

    if (day === 12 && dustingInterval < 365) {
      dayTasks.push({ category: 'Coupe/Dusting', recurrence: `Tous les ${dustingInterval} jours` });
    }

    dayTasks.forEach(task => {
      // Don't add duplicate category tasks on the same day if already scheduled (e.g. Bain d'huile and Lavage scheduled at day 0)
      const exists = items.some(item => item.date === dateStr && item.category === task.category);
      if (!exists) {
        items.push({
          id: uuid(),
          profileId,
          category: task.category,
          product: task.product ? task.product : getProductForTask(task.category, column),
          recurrence: task.recurrence,
          date: dateStr,
          completed: false,
          enableNotificationReminder: true,
        });
      }
    });
  }

  if (diagnostic.porosity === null) {
    const j7Str = new Date(todayMs + 7 * 86400000).toISOString().split('T')[0];
    items.push({
      id: uuid(),
      profileId,
      category: 'Test de Porosité',
      product: 'Rappel : Faire le test du verre d\'eau 🔬',
      recurrence: 'Unique (Rappel J+7)',
      date: j7Str,
      completed: false,
      enableNotificationReminder: true,
    });
  }

  return items;
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme & Master Account credentials
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [masterEmail, setMasterEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');

  // Premium status state
  const [isPremium, setIsPremium] = useState<boolean>(false);

  // Pre-configured Profiles
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [showFeedbackQuiz, setShowFeedbackQuiz] = useState<boolean>(false);
  const [lastLoggedCategory, setLastLoggedCategory] = useState<string>('Lavage');

  // Care completed summary state
  const [lastValidatedCare, setLastValidatedCare] = useState<{ category: string; date: string } | null>(null);
  const [lastFeedbackDelta, setLastFeedbackDelta] = useState<number>(0);
  const [lastFeedbackReason, setLastFeedbackReason] = useState<string>('');
  const [showCareSummary, setShowCareSummary] = useState<boolean>(false);

  // Pre-configured Routine / Agenda
  const [routine, setRoutine] = useState<RoutineItem[]>([]);

  const [logs, setLogs] = useState<ActionLog[]>([]);

  // Startup session lock to prevent race conditions
  const [isSavedCredentialsLoaded, setIsSavedCredentialsLoaded] = useState(false);

  // Firestore loading/sync locks to prevent race conditions during initialization
  const [isLoading, setIsLoading] = useState(true);

  // 0. Load saved credentials from local storage on app startup to persist session
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('masterEmail');
        const savedPassword = await AsyncStorage.getItem('masterPassword');
        if (savedEmail) {
          setMasterEmail(savedEmail);
          if (savedPassword) {
            setMasterPassword(savedPassword);
          }
        }
      } catch (error) {
        console.error("Error loading saved credentials from AsyncStorage:", error);
      } finally {
        setIsSavedCredentialsLoaded(true);
      }
    };
    loadSavedCredentials();
  }, []);

  // 1. Load entire account data from Firestore when masterEmail changes
  useEffect(() => {
    if (!isSavedCredentialsLoaded) return; // Wait until stored credentials check completes!

    const loadFromFirestore = async () => {
      if (!masterEmail) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const docRef = doc(db, 'accounts', masterEmail.toLowerCase().trim());
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profiles) setProfiles(data.profiles);
          if (data.routine) setRoutine(data.routine);
          if (data.logs) setLogs(data.logs);
          if (data.activeProfileId) setActiveProfileId(data.activeProfileId);
          if (data.themeMode) setThemeMode(data.themeMode);
          if (data.isPremium !== undefined) setIsPremium(data.isPremium);
        } else {
          // Document does not exist in Cloud, initialize it with current local state
          await setDoc(docRef, {
            masterEmail: masterEmail.toLowerCase().trim(),
            themeMode,
            activeProfileId,
            profiles,
            routine,
            logs,
            isPremium,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Erreur de chargement Firestore :", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromFirestore();
  }, [masterEmail, isSavedCredentialsLoaded]);

  // 2. Automatically sync all local state changes back to Firestore
  useEffect(() => {
    if (isLoading || !masterEmail) return;

    const syncToFirestore = async () => {
      try {
        const docRef = doc(db, 'accounts', masterEmail.toLowerCase().trim());
        await setDoc(docRef, {
          themeMode,
          activeProfileId,
          profiles,
          routine,
          logs,
          isPremium,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Erreur de synchronisation Firestore :", error);
      }
    };

    syncToFirestore();
  }, [profiles, routine, logs, activeProfileId, themeMode, isLoading, masterEmail, isPremium]);

  // Derived active properties
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const catchUpTask = routine.find(
    r => r.profileId === activeProfileId && r.isPastOverdue && !r.completed
  ) || null;

  // Dynamic regularity score calculation:
  // Count only scheduled cares with date <= todayStr. Rest days are ignored.
  const todayStrForScore = new Date().toISOString().split('T')[0];
  const activeRoutinesForScore = activeProfileId
    ? routine.filter(r => r.profileId === activeProfileId && r.date <= todayStrForScore)
    : [];
  const regularityScore = activeRoutinesForScore.length > 0
    ? Math.round((activeRoutinesForScore.filter(r => r.completed).length / activeRoutinesForScore.length) * 100)
    : 100;

  // Automatically schedule/cancel native notifications in the background
  useEffect(() => {
    if (activeProfile && activeProfileId && routine.length > 0) {
      const notifications = activeProfile.notifications || { enabled: true, time: '08:30', tone: 'Motivant' };
      const { time, tone, enabled } = notifications;
      if (enabled) {
        NotificationService.scheduleDailyCareReminders(
          time,
          routine.filter(r => r.profileId === activeProfileId),
          activeProfile.name,
          tone
        );
      } else {
        NotificationService.cancelAllReminders();
      }
    } else {
      NotificationService.cancelAllReminders();
    }
  }, [activeProfileId, activeProfile?.notifications?.enabled, activeProfile?.notifications?.time, activeProfile?.notifications?.tone, routine]);


  const selectProfile = (id: string) => {
    setActiveProfileId(id);
    setShowFeedbackQuiz(false);
  };

  // Add Profile (diagnostic form submission)
  const addProfile = (
    name: string,
    diagnostic: HairDiagnostic,
    avatar: string,
    notificationsEnabled?: boolean,
    tone?: 'Doux' | 'Motivant' | 'Direct',
    history?: HairHistory
  ) => {
    const newId = uuid();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const newProfile: Profile = {
      id: newId,
      name,
      avatar, // Save the selected illustrated avatar
      diagnostic,
      healthScore: 75,
      hydration: 70,
      nutrition: 80,
      scalp: 75,
      notifications: {
        enabled: notificationsEnabled ?? true,
        time: '08:30',
        tone: tone ?? 'Motivant',
      },
      createdAt: todayStr,
    };

    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newId);
    
    // Generate the 30-day dynamic routine based on reference care table and hair history offsets!
    const generatedRoutine = generateRoutineCalendar(newId, diagnostic, history);
    setRoutine(prev => [...prev, ...generatedRoutine]);
  };

  const completeTodayAction = (category: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    setRoutine(prev => prev.map(item => {
      if (item.profileId === activeProfileId && item.date === todayStr && item.category === category) {
        return { ...item, completed: true };
      }
      return item;
    }));

    const newLog: ActionLog = {
      id: uuid(),
      profileId: activeProfileId,
      date: todayStr,
      category,
      completed: true,
    };
    setLogs(prev => [...prev, newLog]);
    setLastLoggedCategory(category);
    setLastValidatedCare({ category, date: todayStr });

    setTimeout(() => {
      setShowFeedbackQuiz(true);
    }, 600);
  };

  const submitFeedback = (feedback: 'Secs' | 'Top' | 'Lourds') => {
    if (!activeProfile) return;

    const oldScore = activeProfile.healthScore;
    let { hydration, nutrition, scalp } = activeProfile;

    if (feedback === 'Secs') {
      hydration = Math.max(0, hydration - 15);
      nutrition = Math.max(0, nutrition - 5);
    } else if (feedback === 'Top') {
      hydration = Math.min(100, hydration + 12);
      nutrition = Math.min(100, nutrition + 12);
      scalp = Math.min(100, scalp + 8);
    } else if (feedback === 'Lourds') {
      scalp = Math.max(0, scalp - 15);
      nutrition = Math.min(100, nutrition + 5);
    }

    let calculatedScore = Math.round((hydration + nutrition + scalp) / 3);

    // Apply +5 pts bonus jauge for 'Top'
    if (feedback === 'Top') {
      calculatedScore = Math.min(100, calculatedScore + 5);
    }

    const newScore = calculatedScore;
    const delta = newScore - oldScore;

    const todayStr = new Date().toISOString().split('T')[0];

    // Update Profiles State
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          hydration,
          nutrition,
          scalp,
          healthScore: newScore,
        };
      }
      return p;
    }));

    // Update Logs State
    setLogs(prev => prev.map(l => {
      if (l.profileId === activeProfileId && l.date === todayStr && l.category === lastLoggedCategory) {
        return { ...l, feedback };
      }
      return l;
    }));

    // Add future care automatically based on feedback
    if (feedback === 'Secs') {
      // 2 days in the future
      const in2Days = new Date(Date.now() + 2 * 86400000);
      const in2DaysStr = in2Days.toISOString().split('T')[0];
      const newRoutineItem: RoutineItem = {
        id: uuid(),
        profileId: activeProfileId,
        category: 'Soin sans rinçage',
        product: 'Lait Capillaire Hydratant à l\'Hibiscus (Feedback Secs)',
        recurrence: 'Ajustement (Feedback Secs)',
        date: in2DaysStr,
        completed: false,
        enableNotificationReminder: true,
      };
      setRoutine(prev => [...prev, newRoutineItem]);
    } else if (feedback === 'Lourds') {
      // 5 days in the future
      const in5Days = new Date(Date.now() + 5 * 86400000);
      const in5DaysStr = in5Days.toISOString().split('T')[0];
      const newRoutineItem: RoutineItem = {
        id: uuid(),
        profileId: activeProfileId,
        category: 'Clarification',
        product: 'Shampoing clarifiant détox (Feedback Lourds)',
        recurrence: 'Ajustement (Feedback Lourds)',
        date: in5DaysStr,
        completed: false,
        enableNotificationReminder: true,
      };
      setRoutine(prev => [...prev, newRoutineItem]);
    }

    // Set summary screen details
    setLastFeedbackDelta(delta);
    setLastFeedbackReason(
      feedback === 'Secs' 
        ? 'Feedback Secs (Manque d\'hydratation)' 
        : feedback === 'Top' 
          ? 'Feedback Top (Doux, brillants, parfaits)' 
          : 'Feedback Lourds (Saturés, gras)'
    );
    
    // Close feedback quiz and OPEN care summary!
    setShowFeedbackQuiz(false);
    setShowCareSummary(true);
  };

  const closeFeedbackQuiz = () => setShowFeedbackQuiz(false);

  const closeCareSummary = () => setShowCareSummary(false);

  const toggleRoutineCompleted = (id: string) => {
    let targetItem: RoutineItem | undefined;
    
    setRoutine(prev => prev.map(item => {
      if (item.id === id) {
        targetItem = { ...item, completed: !item.completed };
        return targetItem;
      }
      return item;
    }));

    if (targetItem) {
      const wasNowCompleted = targetItem.completed;
      const targetProfileId = targetItem.profileId;
      const targetCategory = targetItem.category;
      const targetDate = targetItem.date;

      // We adjust health metrics based on this retroactive change
      setProfiles(prev => prev.map(p => {
        if (p.id === targetProfileId) {
          let { hydration, nutrition, scalp } = p;
          
          if (wasNowCompleted) {
            // retroactively marking COMPLETED (boost metrics)
            hydration = Math.min(100, hydration + 10);
            nutrition = Math.min(100, nutrition + 10);
          } else {
            // retroactively marking UNCOMPLETED (depreciate metrics)
            hydration = Math.max(0, hydration - 10);
            nutrition = Math.max(0, nutrition - 10);
          }
          
          const healthScore = Math.round((hydration + nutrition + scalp) / 3);
          return {
            ...p,
            hydration,
            nutrition,
            healthScore,
          };
        }
        return p;
      }));

      // Also log the retroactive completion in logs
      if (wasNowCompleted) {
        const newLog: ActionLog = {
          id: uuid(),
          profileId: targetProfileId,
          date: targetDate,
          category: targetCategory,
          completed: true,
        };
        setLogs(prev => [...prev, newLog]);
      } else {
        setLogs(prev => prev.filter(l => !(l.profileId === targetProfileId && l.date === targetDate && l.category === targetCategory)));
      }
    }
  };

  const handleCatchUp = (completed: boolean) => {
    if (!catchUpTask) return;

    if (completed) {
      setRoutine(prev => prev.map(item => {
        if (item.id === catchUpTask.id) {
          return { ...item, completed: true, isPastOverdue: false };
        }
        return item;
      }));

      setProfiles(prev => prev.map(p => {
        if (p.id === activeProfileId) {
          const hydration = Math.min(100, p.hydration + 10);
          const nutrition = Math.min(100, p.nutrition + 10);
          const healthScore = Math.round((hydration + nutrition + p.scalp) / 3);
          return { ...p, hydration, nutrition, healthScore };
        }
        return p;
      }));
    } else {
      setRoutine(prev => prev.map(item => {
        if (item.id === catchUpTask.id) {
          return { ...item, isPastOverdue: false };
        }
        return item;
      }));

      setProfiles(prev => prev.map(p => {
        if (p.id === activeProfileId) {
          const hydration = Math.max(0, p.hydration - 5);
          const nutrition = Math.max(0, p.nutrition - 5);
          const healthScore = Math.round((hydration + nutrition + p.scalp) / 3);
          return { ...p, hydration, nutrition, healthScore };
        }
        return p;
      }));
    }
  };

  const triggerSosBooster = () => {
    if (!activeProfile) return;

    const todayStr = new Date().toISOString().split('T')[0];
    setRoutine(prev => prev.filter(r => !(r.profileId === activeProfileId && r.date > todayStr)));

    const protocols = [
      { day: 1, category: 'Clarification', product: 'Shampoing Clarifiant Détox Argile' },
      { day: 3, category: 'Lavage', product: 'Co-wash Hydratant Doux' },
      { day: 3, category: 'Masque', product: 'Masque Hydratation Profonde & Miel' },
      { day: 5, category: 'Soin sans rinçage', product: 'Lait Hydratant Léger & Huile de Jojoba' },
      { day: 7, category: 'Bain d\'huile', product: 'Bain aux Huiles Chaudes de Coco & Karité' },
      { day: 8, category: 'Lavage', product: 'Shampoing Protecteur Force' },
      { day: 10, category: 'Masque', product: 'Soin Reconstructeur Protéines (Force)' },
      { day: 12, category: 'Soin sans rinçage', product: 'Crème Nourrissante Beurre de Mangue' },
      { day: 14, category: 'Soin sans rinçage', product: 'Brume Hydratante scellée à l\'huile d\'Argan' },
    ];

    const newRoutineItems: RoutineItem[] = protocols.map(proto => {
      const date = new Date(Date.now() + proto.day * 86400000).toISOString().split('T')[0];
      return {
        id: uuid(),
        profileId: activeProfileId,
        category: proto.category,
        product: proto.product,
        recurrence: 'Protocole SOS Booster 14J',
        date,
        completed: false,
        enableNotificationReminder: true,
      };
    });

    setRoutine(prev => [...prev, ...newRoutineItems]);

    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          scalp: Math.min(100, p.scalp + 15),
          healthScore: Math.round((p.hydration + p.nutrition + Math.min(100, p.scalp + 15)) / 3),
        };
      }
      return p;
    }));
  };

  const updateDiagnostic = (newDiagnostic: HairDiagnostic) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, diagnostic: newDiagnostic };
      }
      return p;
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    // Remove all future non-completed routine items for this profile
    setRoutine(prev => prev.filter(r => !(r.profileId === activeProfileId && r.date > todayStr && !r.completed)));

    // Generate new future routine items starting from today
    const generatedRoutine = generateRoutineCalendar(activeProfileId, newDiagnostic);
    // Filter generated to only keep items that are in the future
    const futureGenerated = generatedRoutine.filter(r => r.date > todayStr);
    setRoutine(prev => [...prev, ...futureGenerated]);
  };

  const addCustomRoutineItem = (
    category: string,
    product: string,
    date: string,
    enableNotification?: boolean,
    reminderTime?: string
  ) => {
    const newItem: RoutineItem = {
      id: uuid(),
      profileId: activeProfileId,
      category,
      product,
      recurrence: 'Unique',
      date,
      completed: false,
      enableNotificationReminder: enableNotification ?? true,
      reminderTime: reminderTime,
    };
    setRoutine(prev => [...prev, newItem]);
  };

  const updateRoutineItemTime = (id: string, time: string) => {
    setRoutine(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, reminderTime: time, enableNotificationReminder: true };
      }
      return item;
    }));
  };

  const completePorosity = (porosityValue: 'Faible' | 'Moyenne' | 'Forte') => {
    let updatedDiag: HairDiagnostic | null = null;

    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        updatedDiag = {
          ...p.diagnostic,
          porosity: porosityValue,
        };
        return {
          ...p,
          diagnostic: updatedDiag
        };
      }
      return p;
    }));

    if (updatedDiag) {
      const todayStr = new Date().toISOString().split('T')[0];
      // Remove all future non-completed routine items for this profile
      setRoutine(prev => prev.filter(r => !(r.profileId === activeProfileId && r.date > todayStr && !r.completed)));

      // Generate new future routine items starting from today
      const generatedRoutine = generateRoutineCalendar(activeProfileId, updatedDiag);
      // Filter generated to only keep items that are in the future
      const futureGenerated = generatedRoutine.filter(r => r.date > todayStr);
      setRoutine(prev => [...prev, ...futureGenerated]);
    }
  };

  // ==========================================
  // Settings & Profile Management Methods
  // ==========================================
  const renameProfile = (id: string, newName: string) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, name: newName };
      }
      return p;
    }));
  };

  const changeAvatar = (id: string, newAvatar: string) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, avatar: newAvatar };
      }
      return p;
    }));
  };

  const deleteProfile = (id: string) => {
    // Cannot delete if only 1 profile remains
    if (profiles.length <= 1) return;
    
    // Remove profile
    setProfiles(prev => prev.filter(p => p.id !== id));
    
    // Purge tasks of this profile
    setRoutine(prev => prev.filter(r => r.profileId !== id));
    
    // Switch active profile if we deleted the currently active one
    if (activeProfileId === id) {
      const remaining = profiles.filter(p => p.id !== id);
      setActiveProfileId(remaining[0].id);
    }
  };

  const setPrimaryProfile = (id: string) => {
    // Simply swap active profile immediately
    setActiveProfileId(id);
  };

  const updateNotificationsSetting = (enabled: boolean, time: string, tone: ProfileNotifications['tone']) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          notifications: { enabled, time, tone }
        };
      }
      return p;
    }));
  };

  const toggleThemeMode = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const updateMasterAccount = async (email: string, pass: string) => {
    setIsLoading(true); // Set isLoading to true immediately to lock routing during async Firestore fetch
    setMasterEmail(email);
    setMasterPassword(pass);
    try {
      await AsyncStorage.setItem('masterEmail', email);
      await AsyncStorage.setItem('masterPassword', pass);
    } catch (e) {
      console.error("Error saving credentials to AsyncStorage:", e);
    }
  };

  const deleteMasterAccount = async (onComplete: () => void) => {
    try {
      await AsyncStorage.removeItem('masterEmail');
      await AsyncStorage.removeItem('masterPassword');
    } catch (e) {
      console.error("Error removing credentials from AsyncStorage:", e);
    }
    // Reset state completely
    setMasterEmail('');
    setMasterPassword('');
    setIsLoading(false);
    setProfiles([]);
    setActiveProfileId('');
    setRoutine([]);
    setLogs([]);
    setIsPremium(false);
    onComplete(); // callback to redirect to auth screen
  };

  const deleteRoutineItem = (id: string) => {
    setRoutine(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AppStateContext.Provider value={{
      profiles,
      activeProfileId,
      activeProfile,
      routine,
      logs,
      showFeedbackQuiz,
      catchUpTask,
      themeMode,
      masterEmail,
      isLoading,
      lastValidatedCare,
      lastFeedbackDelta,
      lastFeedbackReason,
      showCareSummary,
      regularityScore,
      isPremium,
      setPremiumStatus: setIsPremium,
      addProfile,
      selectProfile,
      completeTodayAction,
      submitFeedback,
      closeFeedbackQuiz,
      closeCareSummary,
      handleCatchUp,
      triggerSosBooster,
      updateDiagnostic,
      addCustomRoutineItem,
      completePorosity,
      toggleRoutineCompleted,
      deleteRoutineItem,
      updateRoutineItemTime,
      
      renameProfile,
      changeAvatar,
      deleteProfile,
      setPrimaryProfile,
      updateNotificationsSetting,
      toggleThemeMode,
      updateMasterAccount,
      deleteMasterAccount
    }}>
      {children}
    </AppStateContext.Provider>
  );
};
