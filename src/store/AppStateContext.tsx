import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationService } from './NotificationService';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updateEmail, updatePassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';



// Types
export const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatFrenchDateLocal = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const monthIndex = parseInt(parts[1], 10) - 1;
  return `${day} ${months[monthIndex]}`;
};

const matchesCategoryLocal = (prodCat: string, agendaCat: string, prodName?: string): boolean => {
  const pc = prodCat.toLowerCase().trim();
  const ac = agendaCat.toLowerCase().trim();
  const name = prodName ? prodName.toLowerCase() : '';

  if (pc === 'autre' || pc === '') return false;

  const isHeavyGel = name.includes('cire') || name.includes('wax') || name.includes('petrolatum') || name.includes('pétrolatum') || name.includes('gel') || name.includes('gelée') || name.includes('jelly');

  if (ac.includes('bain') || ac.includes('huile')) {
    if (isHeavyGel) return false;
    return pc === "bain d'huile";
  }

  if (ac.includes('lavage') || ac.includes('shampoing') || ac.includes('clarif') || ac.includes('détox')) {
    return pc === 'lavage' || pc === 'clarification';
  }

  if (ac.includes('masque') || ac.includes('profond')) {
    if (isHeavyGel) return false;
    return pc === 'masque hydratant';
  }

  if (ac.includes('retwist')) {
    return pc === 'retwist';
  }

  if (ac.includes('sans rinç') || ac.includes('sans rinc') || ac.includes('leave') ||
      ac.includes('lait') || ac.includes('crème') || ac.includes('creme') ||
      ac.includes('cream') || ac.includes('coiffage') || ac.includes('hydratation')) {
    if (pc === 'retwist' || pc === 'lavage' || pc === 'clarification') return false;
    return pc === 'soin sans rinçage';
  }

  return false;
};

export interface CompatibilityResult {
  score: number;
  title: string;
  color: string;
  description: string;
  compatibility: 'Compatible' | 'Attention';
}

export const evaluateProductCompatibility = (
  brand: string,
  name: string,
  category: string,
  ingredients: string[],
  diagnostic: HairDiagnostic
): CompatibilityResult => {
  const texture = diagnostic.texture || 'Crépus';
  const porosity = diagnostic.porosity || 'Moyenne';
  const thickness = diagnostic.thickness || 'Moyens';
  const sensitivity = diagnostic.sensitivity || [];
  
  const bLower = brand.toLowerCase();
  const nLower = name.toLowerCase();
  const catLower = category.toLowerCase();
  
  const ingText = ingredients.map(i => i.toLowerCase()).join(' ');
  const fullText = `${brand} ${name} ${category} ${ingText}`.toLowerCase();
  
  const colors = {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };

  if (nLower.includes('resistant formula locking gel') || nLower.includes('jamaican mango')) {
    if (texture === 'Locksés') {
      return {
        score: 92,
        title: 'Excellent pour tes locks ! 🔒',
        color: colors.success,
        description: 'Ce gel de locking est formulé sans cire lourde ni vaseline occlusive. Il est soluble dans l\'eau, ce qui évite les accumulations blanches résiduelles (build-ups) à l\'intérieur de tes locks. Un excellent choix pour former tes départs ou resserrer tes racines !',
        compatibility: 'Compatible'
      };
    } else {
      return {
        score: 55,
        title: 'Hold trop rigide pour cheveux libres ⚠️',
        color: colors.warning,
        description: 'Bien que très propre et soluble pour les locks, ce gel a un effet carton extrêmement rigide sur cheveux libres (crépus, bouclés). Il risque d\'assécher tes boucles libres à cause des agents fixateurs forts. Privilégie un lait ou une crème hydratante douce.',
        compatibility: 'Attention'
      };
    }
  }

  if (nLower.includes('extra hold styling wax') || (nLower.includes('cantu shea butter') && nLower.includes('wax'))) {
    if (texture === 'Locksés') {
      return {
        score: 15,
        title: 'DANGEREUX / RÉSIDUS SOLIDES 🚨',
        color: colors.danger,
        description: 'AVERTISSEMENT : Ce produit contient de la cire microcristalline et de l\'huile minérale (paraffine). Ces cires occlusives lourdes sont insolubles à l\'eau et s\'accumulent au cœur des locks sans jamais s\'en aller au lavage. Cela crée des résidus blancs disgracieux et peut emprisonner l\'humidité, causant de la moisissure interne (dread rot). À fuir absolument pour ton profil Locks !',
        compatibility: 'Attention'
      };
    } else {
      return {
        score: 45,
        title: 'Lourd & Occlusif ⚠️',
        color: colors.warning,
        description: 'Ce produit contient beaucoup d\'huiles minérales lourdes. Sur cheveux libres, il étouffe les cuticules et empêche l\'eau d\'y entrer. Idéal uniquement pour des tresses très temporaires mais nécessite une clarification forte immédiatement après.',
        compatibility: 'Attention'
      };
    }
  }

  if (texture === 'Locksés') {
    const hasShea = fullText.includes('shea') || fullText.includes('karite') || fullText.includes('karité');
    const hasCocoa = fullText.includes('cocoa') || fullText.includes('cacao');
    const hasButter = fullText.includes('butter') || fullText.includes('beurre');
    const hasWax = fullText.includes('wax') || fullText.includes('cire') || fullText.includes('beeswax') || fullText.includes('ozokerite');
    const hasMineral = fullText.includes('mineral oil') || fullText.includes('petrolatum') || fullText.includes('paraffin') || fullText.includes('paraffine') || fullText.includes('microcrystalline') || fullText.includes('vaseline') || fullText.includes('pétrolatum');
    const hasCastor = fullText.includes('castor') || fullText.includes('ricin') || fullText.includes('carapate');

    if (hasShea || hasCocoa || hasButter || hasWax || hasMineral || hasCastor) {
      return {
        score: 15,
        title: 'DANGEREUX / RÉSIDUS SOLIDES 🚨',
        color: colors.danger,
        description: `EXCLUSION absolue : Vos cheveux étant Locksés, tout produit contenant des corps gras solides (beurres, cires, huiles lourdes non solubles) est rigoureusement exclu car ils créent des résidus indélogeables (build-ups) au cœur de la lock. Utilisez uniquement des sprays hydratants légers à base d'eau de rose ou de glycérine.`,
        compatibility: 'Attention'
      };
    }
  }

  if (porosity === 'Faible') {
    const hasCoco = fullText.includes('coconut oil') || fullText.includes('huile de coco') || (fullText.includes('coconut') && !fullText.includes('water') && !fullText.includes('eau'));
    const hasShea = fullText.includes('shea') || fullText.includes('karite') || fullText.includes('karité');
    const hasProtein = fullText.includes('protein') || fullText.includes('protéin') || fullText.includes('keratin') || fullText.includes('kératine') || fullText.includes('collagen') || fullText.includes('collagène') || fullText.includes('elastin') || fullText.includes('élastine') || fullText.includes('silk') || fullText.includes('soie');

    if (hasCoco || hasShea || hasProtein) {
      let excludedList = [];
      if (hasCoco) excludedList.push("l'Huile de Coco");
      if (hasShea) excludedList.push("le Beurre de Karité brut");
      if (hasProtein) excludedList.push("les protéines lourdes");
      return {
        score: 48,
        title: 'Risque de saturation (Porosité Faible) ⚠️',
        color: colors.warning,
        description: `Vos cheveux ayant une Porosité Faible, nous avons rigoureusement exclu ${excludedList.join(', ')} de vos soins. Ils saturent la surface de vos cuticules fermées sans y pénétrer. Privilégiez des produits fluides à base d'eau, de gel d'Aloe Vera, d'huile de Jojoba ou de Pépins de Raisin.`,
        compatibility: 'Attention'
      };
    }
  }

  if (thickness === 'Fins' && (catLower.includes('sans rinçage') || catLower.includes('leave') || nLower.includes('leave') || nLower.includes('lait') || nLower.includes('crème') || nLower.includes('creme') || nLower.includes('cream') || nLower.includes('smoothie'))) {
    const hasShea = fullText.includes('shea') || fullText.includes('karite') || fullText.includes('karité');
    const hasAvocado = fullText.includes('avocado') || fullText.includes('avocat');
    const hasCastor = fullText.includes('castor') || fullText.includes('ricin') || fullText.includes('carapate');

    if (hasShea || hasAvocado || hasCastor) {
      let ingredientsFound = [];
      if (hasShea) ingredientsFound.push("Beurre de Karité");
      if (hasAvocado) ingredientsFound.push("Avocat");
      if (hasCastor) ingredientsFound.push("Huile de Ricin");
      return {
        score: 50,
        title: 'Trop lourd pour cheveux fins ⚠️',
        color: colors.warning,
        description: `Vos cheveux étant Fins, nous excluons les beurres lourds (${ingredientsFound.includes("Beurre de Karité") ? 'Karité' : ''}${ingredientsFound.includes("Beurre de Karité") && ingredientsFound.includes("Avocat") ? '/' : ''}${ingredientsFound.includes("Avocat") ? 'Avocat' : ''}) et les huiles visqueuses (Ricin) en soin sans rinçage pour éviter d'écraser le volume. Privilégiez des laits fluides ou des sprays aqueux.`,
        compatibility: 'Attention'
      };
    }
  }

  if (porosity === 'Forte') {
    const hasShea = fullText.includes('shea') || fullText.includes('karite') || fullText.includes('karité');
    const hasCastor = fullText.includes('castor') || fullText.includes('ricin') || fullText.includes('carapate');
    const hasAvocado = fullText.includes('avocado') || fullText.includes('avocat');

    if (hasShea || hasCastor || hasAvocado) {
      let friends = [];
      if (hasShea) friends.push("Beurre de Karité");
      if (hasCastor) friends.push("Huile de Ricin");
      if (hasAvocado) friends.push("Avocat");
      return {
        score: 95,
        title: 'Soin Scellant Parfait (Porosité Forte) 🏆',
        color: colors.success,
        description: `Génial ! Vos cuticules étant très ouvertes (Porosité Forte), ce produit riche en ${friends.join(', ')} est idéal pour combler les brèches et sceller l'hydratation de vos fibres.`,
        compatibility: 'Compatible'
      };
    }
  }

  if (sensitivity.includes('Traités chimiquement')) {
    const hasProtein = fullText.includes('protein') || fullText.includes('protéin') || fullText.includes('keratin') || fullText.includes('kératine') || fullText.includes('silk') || fullText.includes('soie');
    if (hasProtein) {
      return {
        score: 96,
        title: 'Fortifiant Cheveux Traités Chimiquement 🏆',
        color: colors.success,
        description: `Parfait ! Vos cheveux étant Traités Chimiquement, ce soin hautement protéiné (Protéines de Soie / Kératine) est idéal pour reconstruire la structure de vos fibres capillaires endommagées.`,
        compatibility: 'Compatible'
      };
    }
  }

  return {
    score: 85,
    title: 'Très Compatible 🌿',
    color: colors.success,
    description: `Ce produit est parfaitement adapté à ton profil capillaire. Il respecte tes caractéristiques (cheveux ${texture.toLowerCase()}, épaisseur ${thickness.toLowerCase()}, porosité ${porosity?.toLowerCase() || 'moyenne'}).`,
    compatibility: 'Compatible'
  };
};

export const getEducationalExplanationForCare = (category: string, diagnostic: HairDiagnostic): string => {
  const texture = diagnostic.texture || 'Crépus';
  const porosity = diagnostic.porosity || 'Moyenne';
  const thickness = diagnostic.thickness || 'Moyens';
  const sensitivity = diagnostic.sensitivity || [];
  const cat = category.toLowerCase().trim();

  if (texture === 'Locksés') {
    if (cat.includes('lavage') || cat.includes('clarif') || cat.includes('retwist') || cat.includes('rinçage') || cat.includes('leave')) {
      return "Vos cheveux étant Locksés, nous avons strictement exclu tout corps gras solide (beurres, cires, huiles lourdes non solubles) pour privilégier la légèreté de sprays aqueux (ex: Rose/Glycérine) et éviter les résidus blancs (build-ups) au cœur de la lock.";
    }
  }

  if (porosity === 'Faible' && thickness === 'Fins') {
    if (cat.includes('sans rinçage') || cat.includes('leave') || cat.includes('masque') || cat.includes('bain')) {
      return "Vos cheveux étant Fins et à Faible Porosité, nous avons rigoureusement exclu le Karité, l'Avocat et l'huile de Ricin pour privilégier la légèreté du gel d'Aloe Vera, du Jojoba et des Pépins de Raisin.";
    }
  }

  if (porosity === 'Faible') {
    if (cat.includes('sans rinçage') || cat.includes('leave') || cat.includes('masque') || cat.includes('bain') || cat.includes('lavage')) {
      return "Vos cuticules étant serrées (Porosité Faible), nous avons exclu l'huile de Coco et le Karité brut pour privilégier la fluidité de l'Aloe Vera et du Jojoba, permettant au soin de pénétrer sans saturer la surface.";
    }
  }

  if (thickness === 'Fins') {
    if (cat.includes('sans rinçage') || cat.includes('leave')) {
      return "Vos cheveux étant Fins, nous avons rigoureusement exclu les beurres lourds (Karité, Avocat) et l'huile de Ricin en soin sans rinçage pour préserver le volume et éviter d'alourdir vos longueurs.";
    }
  }

  if (porosity === 'Forte') {
    if (cat.includes('sans rinçage') || cat.includes('leave') || cat.includes('masque') || cat.includes('bain')) {
      return "Vos cuticules étant très ouvertes (Porosité Forte), nous avons enrichi ce soin en Beurre de Karité, Ricin et Avocat afin de colmater les brèches et sceller l'hydratation durablement.";
    }
  }

  if (sensitivity.includes('Traités chimiquement')) {
    if (cat.includes('masque') || cat.includes('protéin')) {
      return "Vos cheveux étant Traités chimiquement, nous avons intégré des soins hautement protéinés (Protéines de Soie ou Kératine) pour reconstruire la structure endommagée de vos fibres.";
    }
  }

  return `Soin adapté à votre profil capillaire (cheveux ${texture.toLowerCase()}, épaisseur ${thickness.toLowerCase()}, porosité ${porosity?.toLowerCase() || 'moyenne'}).`;
};


export interface HairDiagnostic {
  texture: 'Ondulés' | 'Bouclés' | 'Frisés' | 'Crépus' | 'Locksés' | 'Raides';
  porosity: 'Faible' | 'Moyenne' | 'Forte' | null;
  thickness: 'Fins' | 'Moyens' | 'Épais';
  sensitivity: ('Cuir chevelu sensible' | 'Casse/Fourches' | 'Naturels' | 'Traités chimiquement')[];
  activeStyle: 'Naturel' | 'Coiffure protectrice' | 'Locks en évolution';
  scalpCondition?: string;
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
  usedProduct?: {
    id: string;
    name: string;
    price: number;
  };
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
  isCustom?: boolean;
  selectedProductId?: string;
}

export interface BathroomProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  ingredients: string[];
  compatibility: 'Compatible' | 'Attention';
  score: number;
  image?: string;
  price?: number;
  inciReport?: {
    good: string[];
    neutral: string[];
    avoid: string[];
  };
  compatibilityExplanation?: string;
  aiAnalyzed?: boolean;
}

export interface ScanHistoryItem {
  id: string;
  profileId: string;
  timestamp: string; // ISO date string
  brand: string;
  name: string;
  image?: string;
  ingredients: string[];
  score: number;
  title: string;
  description: string;
  color?: string;
  inciReport?: {
    good: string[];
    neutral: string[];
    avoid: string[];
  };
}

interface AppStateContextType {
  profiles: Profile[];
  activeProfileId: string;
  activeProfile: Profile | undefined;
  routine: RoutineItem[];
  logs: ActionLog[];
  showFeedbackQuiz: boolean;
  catchUpTask: RoutineItem | null;
  bathroomProducts: BathroomProduct[];
  addBathroomProduct: (product: Omit<BathroomProduct, 'id'>, promptAssociation?: boolean) => BathroomProduct;
  deleteBathroomProduct: (id: string) => void;
  updateBathroomProduct: (id: string, updatedProduct: Partial<BathroomProduct>) => void;
  scanHistory: ScanHistoryItem[];
  addScanHistoryItem: (item: Omit<ScanHistoryItem, 'id' | 'timestamp' | 'profileId'>) => void;
  deleteScanHistoryItem: (id: string) => void;
  themeMode: 'dark' | 'light';
  tempUnit: 'C' | 'F';
  masterEmail: string;
  isLoading: boolean;
  lastValidatedCare: { category: string; date: string } | null;
  lastFeedbackDelta: number;
  lastFeedbackReason: string;
  showCareSummary: boolean;
  regularityScore: number;
  isPremium: boolean;
  setPremiumStatus: (status: boolean) => void;
  freeScansLeft: number;
  consumeScanCredit: () => boolean;
  addProfile: (
    name: string,
    diagnostic: HairDiagnostic,
    avatar: string,
    notificationsEnabled?: boolean,
    tone?: 'Doux' | 'Motivant' | 'Direct',
    history?: HairHistory
  ) => void;
  selectProfile: (id: string) => void;
  completeTodayAction: (category: string, usedProduct?: { id: string; name: string; price: number }) => void;
  submitFeedback: (feedback: 'Secs' | 'Top' | 'Lourds') => void;
  closeFeedbackQuiz: () => void;
  closeCareSummary: () => void;
  handleCatchUp: (completed: boolean) => void;
  updateDiagnostic: (diagnostic: HairDiagnostic) => void;
  addCustomRoutineItem: (category: string, product: string, date: string, enableNotification?: boolean, reminderTime?: string) => void;
  completePorosity: (porosity: 'Faible' | 'Moyenne' | 'Forte') => void;
  toggleRoutineCompleted: (id: string, usedProduct?: { id: string; name: string; price: number }) => void;
  deleteRoutineItem: (id: string) => void;
  updateRoutineItemTime: (id: string, time: string) => void;
  updateRoutineItemDate: (id: string, date: string, time?: string) => void;
  updateRoutineItemProduct: (id: string, selectedProductId?: string) => void;
  shiftRoutineDates: (profileId: string, daysToShift: number, targetCareId?: string, targetTime?: string) => void;
  
  // Settings & Profile Management Methods
  renameProfile: (id: string, newName: string) => void;
  changeAvatar: (id: string, newAvatar: string) => void;
  deleteProfile: (id: string) => void;
  setPrimaryProfile: (id: string) => void;
  updateNotificationsSetting: (enabled: boolean, time: string, tone: ProfileNotifications['tone']) => void;
  toggleThemeMode: () => void;
  toggleTempUnit: () => void;
  updateMasterAccount: (email: string, pass: string) => void;
  deleteMasterAccount: (onComplete: () => void) => void;
  logout: (onComplete: () => void) => void;

  // Active Session states & methods
  isSessionActive: boolean;
  activeSessionCares: RoutineItem[];
  currentStepIndex: number;
  activeSessionTimerEnd: number | null;
  activeSessionTimerDuration: number | null;
  activeSessionTimerRemaining: number | null;
  isTimerRunning: boolean;
  startActiveSession: (date?: string) => void;
  stopActiveSession: () => void;
  startStepTimer: (durationSeconds: number) => void;
  pauseStepTimer: () => void;
  completeCurrentStep: (usedProduct?: { id: string; name: string; price: number }) => void;
  isSessionSuspended: boolean;
  setIsSessionSuspended: (val: boolean) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within an AppStateProvider');
  return context;
};

let uuidCounter = 0;
const uuid = () => {
  uuidCounter += 1;
  return `${Date.now().toString(36)}-${uuidCounter}-${Math.random().toString(36).substring(2, 9)}`;
};

export const getCareOrderWeight = (category: string): number => {
  const cat = category.toLowerCase().trim();
  if (cat.includes("bain d'huile") || cat.includes("bain d’huile") || cat.includes("pre-poo") || cat.includes("avant-lavage")) return 1;
  if (cat.includes("clarification") || cat.includes("clarif") || cat.includes("détox") || cat.includes("detox")) return 2;
  if (cat.includes("lavage") || cat.includes("shampoing") || cat.includes("shampoo")) return 3;
  if (cat.includes("masque") || cat.includes("après-shampoing") || cat.includes("apres-shampoing") || cat.includes("rincer") || cat.includes("à rincer") || cat.includes("a rincer")) return 4;
  if (cat.includes("sans rinçage") || cat.includes("sans rincage") || cat.includes("leave-in") || cat.includes("leave in") || cat.includes("spray") || cat.includes("lait") || cat.includes("crème") || cat.includes("creme") || cat.includes("retwist")) return 5;
  return 6;
};

export const sortRoutineItems = (items: RoutineItem[]): RoutineItem[] => {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    const wA = getCareOrderWeight(a.category);
    const wB = getCareOrderWeight(b.category);
    if (wA !== wB) return wA - wB;
    return b.id.localeCompare(a.id);
  });
};

const isAppRoutineCategory = (cat: string) => {
  const normalized = cat.toLowerCase().trim();
  return (
    normalized.includes('lavage') ||
    normalized.includes('masque') ||
    normalized.includes('clarification') ||
    normalized.includes('bain d\'huile') ||
    normalized.includes('bain d’huile') ||
    normalized.includes('rinçage') ||
    normalized.includes('rincage') ||
    normalized.includes('retwist') ||
    normalized.includes('coupe') ||
    normalized.includes('dusting') ||
    normalized.includes('porosité') ||
    normalized.includes('porosite')
  );
};

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

const getProductForTask = (category: string, column: 'naturel' | 'chimique' | 'locks' | 'crepus' | 'raides', diagnostic: HairDiagnostic): string => {
  const texture = diagnostic.texture;
  const porosity = diagnostic.porosity;
  const thickness = diagnostic.thickness;
  const sensitivity = diagnostic.sensitivity || [];

  if (category === 'Lavage') {
    if (texture === 'Locksés') return 'Shampoing clarifiant sans résidus (ex: Eau de Rose / Glycérine) 🫧';
    if (porosity === 'Faible') return 'Shampoing Doux Clarifiant (Lavage eau tiède/chaude) 🚿';
    if (column === 'raides') return 'Shampoing Léger Sébo-Régulateur (sébum voyage vite)';
    return 'Shampoing Doux Hydratant Capillaire';
  }
  if (category === 'Bain d\'huile') {
    if (texture === 'Locksés') return 'Soin Aqueux Léger (Eau de Rose & Glycérine) - Corps Gras Exclus 🚫';
    if (porosity === 'Faible') return 'Huile Légère de Jojoba ou de Pépins de Raisin (Beurres/Coco exclus) 🍇';
    if (column === 'raides') return 'Huile Légère de Jojoba (soin mensuel très léger)';
    if (porosity === 'Forte') return 'Huile de Ricin ou d\'Avocat (Bain scellant riche) 🥑';
    return 'Huile de Coco, Avocat & Ricin (soin riche)';
  }
  if (category === 'Masque hydratant' || category === 'Masque protéiné') {
    if (texture === 'Locksés') return 'Spray Hydratant Léger aux Plantes (Eau de Rose / Glycérine) 🌿';
    if (sensitivity.includes('Traités chimiquement') || category === 'Masque protéiné') return 'Masque Reconstructeur Fortifiant aux Protéines de Soie & Kératine 💪';
    if (porosity === 'Faible') return 'Gel d\'Aloe Vera Bio (Hydratation légère sans protéine ni coco) 🌵';
    if (column === 'raides') return 'Gel d\'Aloe Vera Purifié (hydratation mensuelle ultra-légère)';
    return 'Masque Nourrissant au Beurre de Karité & Miel';
  }
  if (category === 'Soin sans rinçage') {
    if (texture === 'Locksés') return 'Brumisation Légère (Eau de Rose / Glycérine végétale) 💧';
    if (porosity === 'Faible' && thickness === 'Fins') return 'Lait Capillaire Hydratant Ultra-Léger à l\'eau et gel d\'Aloe Vera 🌵';
    if (thickness === 'Fins') return 'Lait Fluide Léger ou Spray Hydratant Aqueux (Beurres lourds & Ricin exclus) 💧';
    if (porosity === 'Forte') return 'Lait Capillaire Riche scellé au Beurre de Karité ou Avocat 🥑';
    if (sensitivity.includes('Traités chimiquement')) return 'Lait Hydratant Fortifiant aux Protéines de Soie ou Kératine 🧵';
    if (column === 'raides') return 'Pre-poo Spray Hydratant Léger aux Protéines de Soie';
    return 'Lait Capillaire Hydratant à l\'Hibiscus';
  }
  if (category === 'Clarification') {
    if (texture === 'Locksés') return 'Bain de Clarification détox (Bicarbonate & Vinaigre de cidre) 🔬';
    return 'Soin détox à l\'Argile Bentonite naturelle';
  }
  if (category === 'Retwist') {
    return 'Gel d\'Aloe Vera Bio purifié (Cire exclue) 👑';
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
    lavageInterval = 7; // Passe la fréquence de lavage à 7 jours au lieu de 3
    bainInterval = 30;
    masqueInterval = 30;
    dustingInterval = 105;
  }

  // 2. Porosity adjustments
  if (diagnostic.porosity === 'Faible') {
    // Inversion Faible Porosité : Ne pas espacer les lavages. Fixe le lavage à une fréquence régulière
    // lavageInterval reste inchangé
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
    const dateStr = getLocalDateString(new Date(todayMs + day * 86400000));
    const dayTasks: { category: string; product?: string; recurrence: string }[] = [];

    if (day === 0 || day === 30) {
      dayTasks.push({ category: 'Clarification', recurrence: 'Mensuel' });
    }

    // Gentle starting soin sans rinçage if they washed yesterday
    if (day === 0 && history?.lastWash === 'hier') {
      dayTasks.push({ category: 'Soin sans rinçage', product: getProductForTask('Soin sans rinçage', column, diagnostic), recurrence: 'Hydratation de départ' });
    }

    // Wash day logic (with offset)
    const isWashDay = (day - lavageOffset) % lavageInterval === 0 && (day - lavageOffset) >= 0;
    if (isWashDay) {
      const isLowPoro = diagnostic.porosity === 'Faible';
      dayTasks.push({
        category: 'Lavage',
        product: isLowPoro 
          ? 'Shampoing Doux Clarifiant (Lavage eau tiède/chaude) 🚿' 
          : getProductForTask('Lavage', column, diagnostic),
        recurrence: isLowPoro
          ? "Lavage régulier à l'eau tiède ou chaude pour ouvrir artificiellement les écailles closes avant d'hydrater."
          : `Tous les ${lavageInterval} jours`
      });
      dayTasks.push({
        category: 'Soin sans rinçage',
        product: getProductForTask('Soin sans rinçage', column, diagnostic),
        recurrence: 'Après chaque lavage'
      });
    }

    // Régulation Cheveux Raides : massage à sec (soin purifiant/sébo-régulateur) à mi-semaine
    if (column === 'raides' && day % 7 === 3) {
      dayTasks.push({
        category: 'Massage cuir chevelu',
        product: 'Soin Purifiant / Sébo-régulateur (Massage à sec) 💆‍♀️',
        recurrence: 'Toutes les semaines (à mi-chemin) pour réguler le sébum sans agresser'
      });
    }

    // Régulation Forte Porosité : hydratation tous les 2 jours max
    if (diagnostic.porosity === 'Forte' && day % 2 === 0) {
      dayTasks.push({
        category: 'Soin sans rinçage',
        product: getProductForTask('Soin sans rinçage', column, diagnostic),
        recurrence: 'Hydratation porosité forte (tous les 2 jours max)'
      });
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
        const isChimic = diagnostic.sensitivity.includes('Traités chimiquement');
        dayTasks.push({
          category: isChimic ? 'Masque protéiné' : 'Masque hydratant',
          product: getProductForTask(isChimic ? 'Masque protéiné' : 'Masque hydratant', column, diagnostic),
          recurrence: `Tous les ${masqueInterval} jours`
        });
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
          product: task.product ? task.product : getProductForTask(task.category, column, diagnostic),
          recurrence: task.recurrence,
          date: dateStr,
          completed: false,
          enableNotificationReminder: true,
        });
      }
    });
  }

  if (diagnostic.porosity === null) {
    const j7Str = getLocalDateString(new Date(todayMs + 7 * 86400000));
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

  return sortRoutineItems(items);
};

const sanitizeForFirestore = (obj: any): any => {
  if (obj === null) return null;
  if (obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          sanitized[key] = sanitizeForFirestore(val);
        }
      }
    }
    return sanitized;
  }
  return obj;
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme & Master Account credentials
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [masterEmail, setMasterEmail] = useState('');

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
  const [routine, setRoutineInternal] = useState<RoutineItem[]>([]);
  const setRoutine = (value: RoutineItem[] | ((prev: RoutineItem[]) => RoutineItem[])) => {
    if (typeof value === 'function') {
      setRoutineInternal(prev => sortRoutineItems(value(prev)));
    } else {
      setRoutineInternal(sortRoutineItems(value));
    }
  };

  // Active Session states (Fil d'Ariane)
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [activeSessionCares, setActiveSessionCares] = useState<RoutineItem[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeSessionTimerEnd, setActiveSessionTimerEnd] = useState<number | null>(null);
  const [activeSessionTimerDuration, setActiveSessionTimerDuration] = useState<number | null>(null);
  const [activeSessionTimerRemaining, setActiveSessionTimerRemaining] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isSessionSuspended, setIsSessionSuspended] = useState<boolean>(false);

  const [logs, setLogs] = useState<ActionLog[]>([]);

  const [bathroomProducts, setBathroomProducts] = useState<BathroomProduct[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  // Firestore loading/sync locks to prevent race conditions during initialization
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedFromFirestore, setHasLoadedFromFirestore] = useState(false);

  // Quota tracking states
  const [freeScansLeft, setFreeScansLeft] = useState<number>(5);
  const [lastScanResetDate, setLastScanResetDate] = useState<string>('');

  // 0. Listen to Firebase Auth state change and load user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email || '';
        setMasterEmail(email);
        setIsLoading(true);
        setHasLoadedFromFirestore(false);
        try {
          const docRef = doc(db, 'accounts', email.toLowerCase().trim());
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profiles) setProfiles(data.profiles);
            if (data.routine) setRoutine(data.routine);
            if (data.logs) {
              const todayStr = getLocalDateString();
              const sanitizedLogs = data.logs.map((log: any) => {
                if (log.completed && log.date > todayStr) {
                  return { ...log, date: todayStr };
                }
                return log;
              });
              setLogs(sanitizedLogs);
            }
            if (data.activeProfileId) setActiveProfileId(data.activeProfileId);
            if (data.themeMode) setThemeMode(data.themeMode);
            if (data.tempUnit) setTempUnit(data.tempUnit);
            if (data.isPremium !== undefined) setIsPremium(data.isPremium);
            if (data.bathroomProducts) setBathroomProducts(data.bathroomProducts);
            if (data.scanHistory) setScanHistory(data.scanHistory);

            // Quota auto-reset logic on 30-day cycle
            const now = new Date();
            const lastReset = data.lastScanResetDate ? new Date(data.lastScanResetDate) : null;
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            
            if (!lastReset || (now.getTime() - lastReset.getTime()) >= thirtyDaysInMs) {
              setFreeScansLeft(5);
              setLastScanResetDate(now.toISOString());
            } else {
              setFreeScansLeft(data.freeScansLeft !== undefined ? data.freeScansLeft : 5);
              setLastScanResetDate(data.lastScanResetDate || now.toISOString());
            }
          } else {
            // Document does not exist in Cloud, initialize it with current local state
            const nowIso = new Date().toISOString();
            await setDoc(docRef, {
              masterEmail: email.toLowerCase().trim(),
              themeMode: 'dark',
              tempUnit: 'C',
              activeProfileId: '',
              profiles: [],
              routine: [],
              logs: [],
              isPremium: false,
              bathroomProducts: [],
              scanHistory: [],
              freeScansLeft: 5,
              lastScanResetDate: nowIso,
              updatedAt: nowIso
            });
            // Reset local states to empty since it is a brand new account
            setProfiles([]);
            setActiveProfileId('');
            setRoutine([]);
            setLogs([]);
            setIsPremium(false);
            setBathroomProducts([]);
            setScanHistory([]);
            setFreeScansLeft(5);
            setLastScanResetDate(nowIso);
          }
          setHasLoadedFromFirestore(true);
        } catch (error) {
          console.warn("Erreur de chargement Firestore :", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Reset everything if user logs out
        setMasterEmail('');
        setProfiles([]);
        setActiveProfileId('');
        setRoutine([]);
        setLogs([]);
        setIsPremium(false);
        setBathroomProducts([]);
        setScanHistory([]);
        setIsLoading(false);
        setHasLoadedFromFirestore(false);
        setFreeScansLeft(5);
        setLastScanResetDate('');
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Automatically sync all local state changes back to Firestore
  useEffect(() => {
    if (isLoading || !masterEmail || !hasLoadedFromFirestore) return;

    const syncToFirestore = async () => {
      try {
        const docRef = doc(db, 'accounts', masterEmail.toLowerCase().trim());
        const dataToSync = sanitizeForFirestore({
          themeMode,
          tempUnit,
          activeProfileId,
          profiles,
          routine,
          logs,
          isPremium,
          bathroomProducts,
          scanHistory,
          freeScansLeft,
          lastScanResetDate,
          updatedAt: new Date().toISOString()
        });
        await setDoc(docRef, dataToSync, { merge: true });
      } catch (error) {
        console.warn("Erreur de synchronisation Firestore :", error);
      }
    };

    syncToFirestore();
  }, [profiles, routine, logs, activeProfileId, themeMode, isLoading, masterEmail, isPremium, bathroomProducts, scanHistory, hasLoadedFromFirestore, freeScansLeft, lastScanResetDate]);

  // Derived active properties
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const catchUpTask = routine.find(
    r => r.profileId === activeProfileId && r.isPastOverdue && !r.completed
  ) || null;

  // Dynamic regularity score calculation:
  // Count only scheduled cares with date <= todayStr. Rest days are ignored.
  const todayStrForScore = getLocalDateString();
  const activeRoutinesForScore = activeProfileId
    ? routine.filter(r => r.profileId === activeProfileId && r.date <= todayStrForScore)
    : [];
  const regularityScore = activeRoutinesForScore.length > 0
    ? Math.round((activeRoutinesForScore.filter(r => r.completed).length / activeRoutinesForScore.length) * 100)
    : 100;

  // Automatically schedule/cancel native notifications in the background
  useEffect(() => {
    if (activeProfile && activeProfileId && routine.length > 0) {
      const notifications = activeProfile.notifications || { enabled: true, time: '09:00', tone: 'Motivant' };
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
    const todayStr = getLocalDateString();
    
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
        time: '09:00',
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

  const completeTodayAction = (category: string, usedProduct?: { id: string; name: string; price: number }) => {
    const todayStr = getLocalDateString();
    
    // Find if the routine item for today that is being completed is custom
    const targetItem = routine.find(item => 
      item.profileId === activeProfileId && 
      item.date === todayStr && 
      item.category === category &&
      !item.completed
    );

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
      usedProduct,
    };
    setLogs(prev => [...prev, newLog]);
    setLastLoggedCategory(category);
    setLastValidatedCare({ category, date: todayStr });

    const isCustom = !targetItem || targetItem.isCustom || targetItem.recurrence === 'Unique' || !isAppRoutineCategory(category) || category === 'Soin personnalisé';

    if (!isCustom) {
      setTimeout(() => {
        setShowFeedbackQuiz(true);
      }, 600);
    } else {
      // Custom/personalized care: bypass feedback quiz and update metrics directly
      if (activeProfile) {
        const oldScore = activeProfile.healthScore;
        const newHydration = Math.min(100, activeProfile.hydration + 10);
        const newNutrition = Math.min(100, activeProfile.nutrition + 10);
        const newScore = Math.round((newHydration + newNutrition + activeProfile.scalp) / 3);
        const delta = newScore - oldScore;

        setProfiles(prev => prev.map(p => {
          if (p.id === activeProfileId) {
            return {
              ...p,
              hydration: newHydration,
              nutrition: newNutrition,
              healthScore: newScore,
            };
          }
          return p;
        }));

        setLastFeedbackDelta(delta);
        setLastFeedbackReason("Soin personnalisé complété avec succès ! Prends soin de toi au quotidien.");
        setTimeout(() => {
          setShowCareSummary(true);
        }, 600);
      }
    }
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

    const todayStr = getLocalDateString();

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

    // Add or adjust future cares intelligently based on feedback, hair texture and porosity
    const porosity = activeProfile.diagnostic?.porosity || 'Moyenne';
    const texture = activeProfile.diagnostic?.texture || 'Crépus';
    
    let feedbackExplanation = '';

    if (feedback === 'Secs') {
      const in2Days = new Date(Date.now() + 2 * 86400000);
      const in2DaysStr = getLocalDateString(in2Days);
      
      let secProduct = "Lait Capillaire Hydratant à l'Hibiscus & Aloe Vera";
      if (texture === 'Locksés') {
        secProduct = "Vaporisateur Hydratant à l'Eau de Rose et Glycérine végétale";
      } else if (porosity === 'Faible') {
        secProduct = "Lait Capillaire Hydratant Léger appliqué sous Bonnet Chauffant";
      } else if (porosity === 'Forte') {
        secProduct = "Lait Capillaire Hydratant Riche scellé au Beurre de Karité";
      } else if (texture === 'Crépus') {
        secProduct = "Lait Capillaire Riche & Gelée d'Hibiscus hydratante";
      }

      // Check if there is an upcoming uncompleted hydration/mask care in the next 7 days to move closer
      let careAdjusted = false;
      const in7Days = new Date(Date.now() + 7 * 86400000);
      const in7DaysStr = getLocalDateString(in7Days);

      setRoutine(prev => {
        // Let's find if there is an upcoming hydration care
        const targetIndex = prev.findIndex(item => 
          item.profileId === activeProfileId && 
          !item.completed && 
          item.date > todayStr && 
          item.date <= in7DaysStr &&
          (item.category === 'Masque hydratant' || item.category === 'Soin sans rinçage')
        );

        if (targetIndex !== -1) {
          careAdjusted = true;
          return prev.map((item, idx) => {
            if (idx === targetIndex) {
              return { 
                ...item, 
                date: in2DaysStr, 
                product: `${secProduct} (Ajustement Secs)`,
                recurrence: 'Ajustement (Feedback Secs)'
              };
            }
            return item;
          });
        } else {
          // If not found, insert a new hydration care
          const newRoutineItem: RoutineItem = {
            id: uuid(),
            profileId: activeProfileId,
            category: 'Soin sans rinçage',
            product: `${secProduct} (Feedback Secs)`,
            recurrence: 'Ajustement (Feedback Secs)',
            date: in2DaysStr,
            completed: false,
            enableNotificationReminder: true,
          };
          return [...prev, newRoutineItem];
        }
      });

      feedbackExplanation = careAdjusted 
        ? `Soin hydratant avancé déplacé au ${in2DaysStr} pour hydrater tes cheveux ${texture.toLowerCase()} de porosité ${porosity.toLowerCase()}.`
        : `Nouveau soin hydratant planifié le ${in2DaysStr} pour hydrater tes cheveux ${texture.toLowerCase()} de porosité ${porosity.toLowerCase()}.`;

    } else if (feedback === 'Lourds') {
      const in2Days = new Date(Date.now() + 2 * 86400000);
      const in2DaysStr = getLocalDateString(in2Days);
      
      let detoxProduct = "Shampoing Clarifiant Détox au Romarin & Argile Blanche";
      if (texture === 'Locksés') {
        detoxProduct = "Bain de Clarification détox au Bicarbonate & Vinaigre de Cidre";
      } else if (porosity === 'Faible') {
        detoxProduct = "Clarification Douce au Ghassoul (Légère & sans tension)";
      } else if (porosity === 'Forte') {
        detoxProduct = "Masque Purifiant Clarifiant à l'Argile Bentonite";
      }

      // 1. Insert/schedule a clarification card in 2 days
      const newRoutineItem: RoutineItem = {
        id: uuid(),
        profileId: activeProfileId,
        category: 'Clarification',
        product: `${detoxProduct} (Feedback Lourds)`,
        recurrence: 'Ajustement (Feedback Lourds)',
        date: in2DaysStr,
        completed: false,
        enableNotificationReminder: true,
      };

      // 2. Postpone any upcoming heavy cares (oil baths, protein masks) by 4 days to let the scalp and hair breathe
      const in7Days = new Date(Date.now() + 7 * 86400000);
      const in7DaysStr = getLocalDateString(in7Days);
      
      let richCaresDelayed = 0;

      setRoutine(prev => {
        const updated = prev.map(item => {
          if (
            item.profileId === activeProfileId &&
            !item.completed &&
            item.date > todayStr &&
            item.date <= in7DaysStr &&
            (item.category === 'Bain d\'huile' || item.category === 'Masque protéiné' || item.category.toLowerCase().includes('protéin') || item.category.toLowerCase().includes('beurre'))
          ) {
            richCaresDelayed++;
            const currentDate = new Date(item.date);
            currentDate.setDate(currentDate.getDate() + 4);
            return {
              ...item,
              date: getLocalDateString(currentDate),
              product: `${item.product} (Reporté - Cheveux saturés)`
            };
          }
          return item;
        });
        return [...updated, newRoutineItem];
      });

      feedbackExplanation = richCaresDelayed > 0
        ? `Clarification ajoutée le ${in2DaysStr} pour tes locks/cheveux ${texture.toLowerCase()} et reports de ${richCaresDelayed} soin(s) gras/lourd(s) pour laisser respirer tes fibres.`
        : `Clarification ajoutée le ${in2DaysStr} pour libérer tes cheveux ${texture.toLowerCase()} de porosité ${porosity.toLowerCase()} de toute surcharge de produit.`;

    } else {
      feedbackExplanation = "Génial ! Tes cheveux se portent à merveille. On poursuit l'agenda des soins prévu sans aucune modification ! Continuons ainsi.";
    }

    // Set summary screen details
    setLastFeedbackDelta(delta);
    setLastFeedbackReason(feedbackExplanation);
    
    // Close feedback quiz and OPEN care summary!
    setShowFeedbackQuiz(false);
    setShowCareSummary(true);
  };

  const closeFeedbackQuiz = () => setShowFeedbackQuiz(false);

  const closeCareSummary = () => setShowCareSummary(false);

  const toggleRoutineCompleted = (id: string, usedProduct?: { id: string; name: string; price: number }) => {
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
        const todayStr = getLocalDateString();
        const logDate = targetDate > todayStr ? todayStr : targetDate;
        const newLog: ActionLog = {
          id: uuid(),
          profileId: targetProfileId,
          date: logDate,
          category: targetCategory,
          completed: true,
          usedProduct,
        };
        setLogs(prev => [...prev, newLog]);

        const isCustom = !targetItem || targetItem.isCustom || targetItem.recurrence === 'Unique' || !isAppRoutineCategory(targetCategory) || targetCategory === 'Soin personnalisé';

        // Open feedback popup for any completed care item!
        setLastLoggedCategory(targetCategory);
        setLastValidatedCare({ category: targetCategory, date: logDate });

        if (!isCustom) {
          setTimeout(() => {
            setShowFeedbackQuiz(true);
          }, 600);
        } else {
          // Custom/personalized care: bypass feedback quiz and calculate delta based on already updated metrics
          if (activeProfile) {
            const oldScore = activeProfile.healthScore;
            const newHydration = Math.min(100, activeProfile.hydration + 10);
            const newNutrition = Math.min(100, activeProfile.nutrition + 10);
            const newScore = Math.round((newHydration + newNutrition + activeProfile.scalp) / 3);
            const delta = newScore - oldScore;

            setLastFeedbackDelta(delta);
            setLastFeedbackReason("Soin personnalisé complété avec succès ! Prends soin de toi au quotidien.");
            setTimeout(() => {
              setShowCareSummary(true);
            }, 600);
          }
        }
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



  const updateDiagnostic = (newDiagnostic: HairDiagnostic) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, diagnostic: newDiagnostic };
      }
      return p;
    }));

    // Recalculate compatibility and score for all bathroom products
    setBathroomProducts(prev => prev.map(p => {
      const evaluation = evaluateProductCompatibility(p.brand, p.name, p.category, p.ingredients, newDiagnostic);
      return {
        ...p,
        compatibility: evaluation.compatibility,
        score: evaluation.score
      };
    }));

    const todayStr = getLocalDateString();
    
    // Determine which categories are already completed today to prevent duplicate recreation
    let completedTodayCategories: string[] = [];
    setRoutine(prev => {
      completedTodayCategories = prev
        .filter(r => r.profileId === activeProfileId && r.date === todayStr && r.completed)
        .map(r => r.category);
      
      // Remove all future and today's non-completed routine items for this profile
      return prev.filter(r => !(r.profileId === activeProfileId && r.date >= todayStr && !r.completed));
    });

    // Generate new routine items starting from today
    const generatedRoutine = generateRoutineCalendar(activeProfileId, newDiagnostic);
    // Keep items starting from today, and filter out today's generated items that are already completed
    const futureOrTodayGenerated = generatedRoutine.filter(r => {
      if (r.date < todayStr) return false;
      if (r.date === todayStr && completedTodayCategories.includes(r.category)) return false;
      return true;
    });

    setRoutine(prev => [...prev, ...futureOrTodayGenerated]);

    // Update active session if currently active on screen
    if (isSessionActive) {
      const todayCares = futureOrTodayGenerated.filter(r => r.date === todayStr);
      if (todayCares.length > 0) {
        const sortedCares = sortRoutineItems(todayCares);
        setActiveSessionCares(sortedCares);
        setCurrentStepIndex(0);
      } else {
        setIsSessionActive(false);
        setIsSessionSuspended(false);
        setActiveSessionCares([]);
        setCurrentStepIndex(0);
      }
    }
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
      isCustom: true,
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

  const updateRoutineItemDate = (id: string, date: string, time?: string) => {
    setRoutine(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, date };
        if (time) {
          updated.reminderTime = time;
          updated.enableNotificationReminder = true;
        }
        return updated;
      }
      return item;
    }));
  };

  const updateRoutineItemProduct = (id: string, selectedProductId?: string) => {
    setRoutine(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, selectedProductId };
      }
      return item;
    }));
  };

  const shiftRoutineDates = (profileId: string, daysToShift: number, targetCareId?: string, targetTime?: string) => {
    const clampedShift = Math.max(-30, Math.min(30, daysToShift));

    setRoutine(prev => prev.map(item => {
      let updatedItem = item;
      // If this is the target care of the shift, update its time if targetTime is provided
      if (targetCareId && item.id === targetCareId && targetTime) {
        updatedItem = { ...item, reminderTime: targetTime, enableNotificationReminder: true };
      }

      // Only shift uncompleted cares for the active profile
      // Exception: do NOT shift manual/free cares (isCustom, category === 'Soin personnalisé' or recurrence contains 'Unique')
      const isCustomCare = 
        updatedItem.isCustom || 
        updatedItem.category === 'Soin personnalisé' ||
        (updatedItem.recurrence && (updatedItem.recurrence === 'Unique' || updatedItem.recurrence.includes('Unique')));

      if (
        updatedItem.profileId === profileId &&
        !updatedItem.completed &&
        !isCustomCare
      ) {
        if (clampedShift !== 0) {
          // Parse date safely to avoid timezone shifting
          const [y, m, d] = updatedItem.date.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d, 12, 0, 0, 0); // Local noon is safe from DST and timezone shifts
          dateObj.setDate(dateObj.getDate() + clampedShift);
          const newDateStr = getLocalDateString(dateObj);
          return { ...updatedItem, date: newDateStr };
        }
      }
      return updatedItem;
    }));
  };

  const addBathroomProduct = (productData: Omit<BathroomProduct, 'id'>, promptAssociation = false) => {
    const newId = uuid();
    const newProduct: BathroomProduct = {
      ...productData,
      id: newId
    };
    
    setBathroomProducts(prev => {
      // Prevent duplicates
      if (prev.some(p => p.brand.toLowerCase() === newProduct.brand.toLowerCase() && p.name.toLowerCase() === newProduct.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newProduct];
    });

    // Proactive agenda script:
    // Update future uncompleted routine items where category matches
    if (newProduct.compatibility !== 'Attention') {
      setRoutine(prev => prev.map(item => {
        if (
          item.profileId === activeProfileId &&
          !item.completed &&
          item.date >= getLocalDateString()
        ) {
          if (matchesCategoryLocal(newProduct.category, item.category, newProduct.name)) {
            // Check for conflicts / bad interactions
            const isOcclusive = newProduct.ingredients.some(i => 
              i.toLowerCase().includes('mineral oil') || 
              i.toLowerCase().includes('petrolatum') || 
              i.toLowerCase().includes('cire') || 
              i.toLowerCase().includes('wax')
            );
            
            const profile = profiles.find(p => p.id === activeProfileId);
            const isLowPoro = profile?.diagnostic?.porosity === 'Faible';
            
            let suggestion = `Tu peux faire ce soin avec ${newProduct.brand} - ${newProduct.name} de ta salle de bain.`;
            
            if (isOcclusive && isLowPoro) {
              suggestion += ` ⚠️ Attention : ce produit est lourd et occlusif, peu conseillé pour ta porosité faible.`;
            }
            
            return {
              ...item,
              product: `${newProduct.brand} - ${newProduct.name} 🧴`,
              recurrence: suggestion
            };
          }
        }
        return item;
      }));
    }

    // Prompt association logic if requested
    if (promptAssociation) {
      const todayStr = getLocalDateString();
      const nextMatchingCare = routine.find(item => 
        item.profileId === activeProfileId &&
        !item.completed &&
        item.date >= todayStr &&
        matchesCategoryLocal(newProduct.category, item.category, newProduct.name)
      );

      if (nextMatchingCare) {
        const careName = nextMatchingCare.category;
        const careDate = formatFrenchDateLocal(nextMatchingCare.date);
        const productName = `${newProduct.brand} - ${newProduct.name}`;
        
        const performAssociation = () => {
          updateRoutineItemProduct(nextMatchingCare.id, newProduct.id);
        };

        const isAttention = newProduct.compatibility === 'Attention';
        const title = isAttention ? "Associer quand même ? ⚠️" : "Associer à un soin prévu ? 📅";
        const message = isAttention 
          ? `Ce produit n'est pas idéalement compatible avec ton profil. Souhaites-tu tout de même planifier l'utilisation de "${productName}" pour ton soin "${careName}" du ${careDate} ?`
          : `Souhaitez-vous planifier l'utilisation de "${productName}" pour votre soin "${careName}" du ${careDate} ?`;

        if (Platform.OS === 'web') {
          const confirm = window.confirm(message);
          if (confirm) {
            performAssociation();
          }
        } else {
          Alert.alert(
            title,
            message,
            [
              { text: "Non", style: "cancel" },
              { text: isAttention ? "Oui, associer quand même" : "Oui, associer", onPress: performAssociation }
            ]
          );
        }
      }
    }

    return newProduct;
  };

  const deleteBathroomProduct = (id: string) => {
    setBathroomProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateBathroomProduct = (id: string, updatedProduct: Partial<BathroomProduct>) => {
    setBathroomProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, ...updatedProduct };
      }
      return p;
    }));

    // Propagate changes to care logs
    setLogs(prev => prev.map(log => {
      if (log.usedProduct && log.usedProduct.id === id) {
        return {
          ...log,
          usedProduct: {
            ...log.usedProduct,
            ...(updatedProduct.name !== undefined ? { name: updatedProduct.name } : {}),
            ...(updatedProduct.price !== undefined ? { price: updatedProduct.price! } : {}),
          }
        };
      }
      return log;
    }));
  };

  const consumeScanCredit = (): boolean => {
    if (isPremium) return true;
    if (freeScansLeft > 0) {
      setFreeScansLeft(prev => prev - 1);
      return true;
    }
    return false;
  };

  const addScanHistoryItem = (itemData: Omit<ScanHistoryItem, 'id' | 'timestamp' | 'profileId'>) => {
    const newId = uuid();
    const newHistoryItem: ScanHistoryItem = {
      ...itemData,
      id: newId,
      profileId: activeProfileId,
      timestamp: new Date().toISOString()
    };
    
    setScanHistory(prev => {
      // Avoid exact duplicates scanned in the same few seconds
      if (prev.some(p => p.brand.toLowerCase() === newHistoryItem.brand.toLowerCase() && p.name.toLowerCase() === newHistoryItem.name.toLowerCase() && p.profileId === activeProfileId && Math.abs(new Date(p.timestamp).getTime() - new Date(newHistoryItem.timestamp).getTime()) < 3000)) {
        return prev;
      }
      return [newHistoryItem, ...prev]; // newest first
    });
  };

  const deleteScanHistoryItem = (id: string) => {
    setScanHistory(prev => prev.filter(item => item.id !== id));
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
      const diagObj = updatedDiag as HairDiagnostic;
      setBathroomProducts(prev => prev.map(p => {
        const evaluation = evaluateProductCompatibility(p.brand, p.name, p.category, p.ingredients, diagObj);
        return {
          ...p,
          compatibility: evaluation.compatibility,
          score: evaluation.score
        };
      }));

      const todayStr = getLocalDateString();
      
      // Determine which categories are already completed today to prevent duplicate recreation
      let completedTodayCategories: string[] = [];
      setRoutine(prev => {
        completedTodayCategories = prev
          .filter(r => r.profileId === activeProfileId && r.date === todayStr && r.completed)
          .map(r => r.category);
        
        // Remove all future and today's non-completed routine items for this profile
        return prev.filter(r => !(r.profileId === activeProfileId && r.date >= todayStr && !r.completed));
      });

      // Generate new routine items starting from today
      const generatedRoutine = generateRoutineCalendar(activeProfileId, updatedDiag);
      // Keep items starting from today, and filter out today's generated items that are already completed
      const futureOrTodayGenerated = generatedRoutine.filter(r => {
        if (r.date < todayStr) return false;
        if (r.date === todayStr && completedTodayCategories.includes(r.category)) return false;
        return true;
      });

      setRoutine(prev => [...prev, ...futureOrTodayGenerated]);

      // Update active session if currently active on screen
      if (isSessionActive) {
        const todayCares = futureOrTodayGenerated.filter(r => r.date === todayStr);
        if (todayCares.length > 0) {
          const sortedCares = sortRoutineItems(todayCares);
          setActiveSessionCares(sortedCares);
          setCurrentStepIndex(0);
        } else {
          setIsSessionActive(false);
          setIsSessionSuspended(false);
          setActiveSessionCares([]);
          setCurrentStepIndex(0);
        }
      }
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

  const toggleTempUnit = () => {
    setTempUnit(prev => prev === 'C' ? 'F' : 'C');
  };

  const updateMasterAccount = async (email: string, pass: string) => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const oldEmail = user.email || '';
        const newEmailNormalized = email.toLowerCase().trim();
        
        if (newEmailNormalized !== oldEmail.toLowerCase().trim()) {
          await updateEmail(user, newEmailNormalized);
          setMasterEmail(newEmailNormalized);
        }
        
        if (pass && pass !== '••••••••') {
          if (pass.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
          }
          await updatePassword(user, pass);
        }
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    }
    setIsLoading(false);
  };

  const deleteMasterAccount = async (onComplete: () => void) => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const email = user.email || '';
        if (email) {
          const docRef = doc(db, 'accounts', email.toLowerCase().trim());
          await deleteDoc(docRef);
          console.log("Master account deleted from Firestore successfully.");
        }
      } catch (error) {
        console.error("Error deleting document from Firestore:", error);
      }
      try {
        await user.delete();
      } catch (error) {
        console.error("Error deleting user from Firebase Auth:", error);
      }
    }
    setIsLoading(false);
    onComplete();
  };

  const logout = async (onComplete: () => void) => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Error signing out:", e);
    } finally {
      setIsLoading(false);
      onComplete();
    }
  };


  const deleteRoutineItem = (id: string) => {
    setRoutine(prev => prev.filter(item => item.id !== id));
    
    // Sync active session cares if active
    setActiveSessionCares(prev => {
      const filtered = prev.filter(item => item.id !== id);
      if (filtered.length === 0) {
        setIsSessionActive(false);
        setIsSessionSuspended(false);
      }
      // Safely update step index to stay in bounds of the filtered session cares
      setCurrentStepIndex(curr => Math.max(0, Math.min(curr, filtered.length - 1)));
      return filtered;
    });
  };

  // Active Session Actions
  const startActiveSession = (date?: string) => {
    const targetDate = date || getLocalDateString();
    
    // Find uncompleted cares for active profile on this day
    const dayCares = routine.filter(
      r => r.profileId === activeProfileId && r.date === targetDate && !r.completed
    );

    if (dayCares.length === 0) return;

    // Sort using sortRoutineItems order
    const sortedCares = sortRoutineItems(dayCares);
    
    setActiveSessionCares(sortedCares);
    setCurrentStepIndex(0);
    setIsSessionActive(true);
    setIsSessionSuspended(false);
    // Reset timer
    setActiveSessionTimerEnd(null);
    setActiveSessionTimerDuration(null);
    setActiveSessionTimerRemaining(null);
    setIsTimerRunning(false);
  };

  const stopActiveSession = () => {
    setIsSessionActive(false);
    setIsSessionSuspended(false);
    setActiveSessionCares([]);
    setCurrentStepIndex(0);
    setActiveSessionTimerEnd(null);
    setActiveSessionTimerDuration(null);
    setActiveSessionTimerRemaining(null);
    setIsTimerRunning(false);
    
    // Re-schedule regular alerts
    if (Platform.OS !== 'web' && activeProfile) {
      const notifications = activeProfile.notifications || { enabled: true, time: '09:00', tone: 'Motivant' };
      if (notifications.enabled) {
        NotificationService.scheduleDailyCareReminders(
          notifications.time,
          routine.filter(r => r.profileId === activeProfileId),
          activeProfile.name,
          notifications.tone
        );
      }
    }
  };

  const startStepTimer = async (durationSeconds: number) => {
    const endTime = Date.now() + durationSeconds * 1000;
    setActiveSessionTimerDuration(durationSeconds);
    setActiveSessionTimerEnd(endTime);
    setIsTimerRunning(true);
    setActiveSessionTimerRemaining(null);

    // If there is a next step, schedule a notification for when the timer ends
    if (currentStepIndex + 1 < activeSessionCares.length && Platform.OS !== 'web') {
      const nextCare = activeSessionCares[currentStepIndex + 1];
      const getNextStepNotificationBody = (nextCategory: string): string => {
        const cat = nextCategory.toLowerCase();
        if (cat.includes('lavage') || cat.includes('shampoing')) {
          return "🚿 Étape suivante : C'est l'heure de rincer et de passer au shampoing !";
        }
        if (cat.includes('masque')) {
          return "🍯 Étape suivante : C'est l'heure d'appliquer ton masque !";
        }
        if (cat.includes('bain')) {
          return "🌿 Étape suivante : C'est l'heure de rincer ton bain d'huile !";
        }
        if (cat.includes('rinçage') || cat.includes('rincage') || cat.includes('leave')) {
          return "🧴 Étape suivante : C'est le moment d'appliquer ton soin sans rinçage pour sceller l'hydratation !";
        }
        if (cat.includes('retwist')) {
          return "👑 Étape suivante : C'est le moment de passer au retwist !";
        }
        if (cat.includes('clarif')) {
          return "🫧 Étape suivante : C'est l'heure de passer à la clarification !";
        }
        return `💆‍♀️ Étape suivante : Passons au soin : ${nextCategory} !`;
      };

      const bodyText = getNextStepNotificationBody(nextCare.category);

      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "My Root'In 🌿 Étape Suivante",
            body: bodyText,
            sound: 'two_pshit.mp3',
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: {
              isNextStepNotification: true,
              nextStepIndex: currentStepIndex + 1
            }
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(endTime),
            channelId: 'my-root-in-reminders-v4',
          }
        });
      } catch (e) {
        console.warn("Error scheduling step timer notification:", e);
      }
    }
  };

  const pauseStepTimer = () => {
    if (activeSessionTimerEnd) {
      const remaining = Math.max(0, Math.round((activeSessionTimerEnd - Date.now()) / 1000));
      setActiveSessionTimerRemaining(remaining);
    }
    setIsTimerRunning(false);
    setActiveSessionTimerEnd(null);
    if (Platform.OS !== 'web' && activeProfile) {
      Notifications.cancelAllScheduledNotificationsAsync().then(() => {
        const notifications = activeProfile.notifications || { enabled: true, time: '09:00', tone: 'Motivant' };
        if (notifications.enabled) {
          NotificationService.scheduleDailyCareReminders(
            notifications.time,
            routine.filter(r => r.profileId === activeProfileId),
            activeProfile.name,
            notifications.tone
          );
        }
      });
    }
  };

  const completeCurrentStep = async (usedProduct?: { id: string; name: string; price: number }) => {
    const currentCare = activeSessionCares[currentStepIndex];
    if (!currentCare) return;

    setRoutine(prev => prev.map(item => {
      if (item.id === currentCare.id) {
        return { ...item, completed: true };
      }
      return item;
    }));

    const todayStr = getLocalDateString();
    const logDate = currentCare.date > todayStr ? todayStr : currentCare.date;
    const newLog: ActionLog = {
      id: uuid(),
      profileId: activeProfileId,
      date: logDate,
      category: currentCare.category,
      completed: true,
      usedProduct,
    };
    setLogs(prev => [...prev, newLog]);
    setLastLoggedCategory(currentCare.category);
    setLastValidatedCare({ category: currentCare.category, date: logDate });

    if (Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch {}
    }

    if (currentStepIndex + 1 < activeSessionCares.length) {
      setCurrentStepIndex(prev => prev + 1);
      setActiveSessionTimerEnd(null);
      setActiveSessionTimerDuration(null);
      setActiveSessionTimerRemaining(null);
      setIsTimerRunning(false);
    } else {
      setIsSessionActive(false);
      setIsSessionSuspended(false);
      setActiveSessionCares([]);
      setCurrentStepIndex(0);
      setActiveSessionTimerEnd(null);
      setActiveSessionTimerDuration(null);
      setActiveSessionTimerRemaining(null);
      setIsTimerRunning(false);

      if (Platform.OS !== 'web' && activeProfile) {
        const notifications = activeProfile.notifications || { enabled: true, time: '09:00', tone: 'Motivant' };
        if (notifications.enabled) {
          NotificationService.scheduleDailyCareReminders(
            notifications.time,
            routine.filter(r => r.profileId === activeProfileId),
            activeProfile.name,
            notifications.tone
          );
        }
      }

      const isCustom = currentCare.isCustom || currentCare.recurrence === 'Unique' || !isAppRoutineCategory(currentCare.category) || currentCare.category === 'Soin personnalisé';
      if (!isCustom) {
        setTimeout(() => {
          setShowFeedbackQuiz(true);
        }, 600);
      } else {
        if (activeProfile) {
          const oldScore = activeProfile.healthScore;
          const newHydration = Math.min(100, activeProfile.hydration + 10);
          const newNutrition = Math.min(100, activeProfile.nutrition + 10);
          const newScore = Math.round((newHydration + newNutrition + activeProfile.scalp) / 3);
          const delta = newScore - oldScore;

          setProfiles(prev => prev.map(p => {
            if (p.id === activeProfileId) {
              return {
                ...p,
                hydration: newHydration,
                nutrition: newNutrition,
                healthScore: newScore,
              };
            }
            return p;
          }));

          setLastFeedbackDelta(delta);
          setLastFeedbackReason("Soin personnalisé complété avec succès ! Prends soin de toi au quotidien.");
          setTimeout(() => {
            setShowCareSummary(true);
          }, 600);
        }
      }
    }
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
      bathroomProducts,
      addBathroomProduct,
      deleteBathroomProduct,
      updateBathroomProduct,
      scanHistory,
      addScanHistoryItem,
      deleteScanHistoryItem,
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
      freeScansLeft,
      consumeScanCredit,
      addProfile,
      selectProfile,
      completeTodayAction,
      submitFeedback,
      closeFeedbackQuiz,
      closeCareSummary,
      handleCatchUp,
      updateDiagnostic,
      addCustomRoutineItem,
      completePorosity,
      toggleRoutineCompleted,
      deleteRoutineItem,
      updateRoutineItemTime,
      updateRoutineItemDate,
      updateRoutineItemProduct,
      shiftRoutineDates,
      
      renameProfile,
      changeAvatar,
      deleteProfile,
      setPrimaryProfile,
      updateNotificationsSetting,
      toggleThemeMode,
      tempUnit,
      toggleTempUnit,
      updateMasterAccount,
      deleteMasterAccount,
      logout,

      // Active Session exposed
      isSessionActive,
      activeSessionCares,
      currentStepIndex,
      activeSessionTimerEnd,
      activeSessionTimerDuration,
      activeSessionTimerRemaining,
      isTimerRunning,
      startActiveSession,
      stopActiveSession,
      startStepTimer,
      pauseStepTimer,
      completeCurrentStep,
      isSessionSuspended,
      setIsSessionSuspended
    }}>
      {children}
    </AppStateContext.Provider>
  );
};