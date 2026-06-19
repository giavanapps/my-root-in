import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Platform, Switch, Animated, PanResponder, Image } from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState, RoutineItem, getCareOrderWeight } from '../../store/AppStateContext';
import { Button } from '../../components/common/Button';
import { TimePickerModal } from '../../components/common/TimePickerModal';
import { DatePickerModal } from '../../components/common/DatePickerModal';
import { matchesCategory } from '../../components/premium/ProductScannerModal';
import * as ImagePicker from 'expo-image-picker';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface CareGuide {
  title: string;
  duration: string;
  steps: string[];
  mistakes: string[];
  products: string;
}

const careGuidesMap: { [key: string]: CareGuide } = {
  'Clarification': {
    title: '🔬 Soin Clarifiant Détox Argile',
    duration: '20 min',
    steps: [
      'Mouille abondamment tes cheveux à l\'eau chaude pour bien ouvrir les cuticules.',
      'Applique la pâte d\'argile bentonite ou ton shampoing clarifiant directement sur ton cuir chevelu par section.',
      'Masse doucement du bout des doigts pour décoller et éliminer les accumulations de produits et le calcaire.',
      'Rince abondamment à l\'eau tiède jusqu\'à ce que l\'eau soit parfaitement claire.'
    ],
    mistakes: [
      'Ne pas faire de clarification trop souvent (limiter à 1 fois par mois pour éviter d\'assécher la fibre).',
      'Oublier de faire un masque profondément hydratant juste après.'
    ],
    products: 'Argile Bentonite naturelle, Argile de Rhassoul ou Shampoing Clarifiant sans silicones.'
  },
  'Lavage': {
    title: 'shampoing Doux Hydratant 🧴',
    duration: '15 min',
    steps: [
      'Sépare tes cheveux en 4 sections pour éviter les nœuds et faciliter le lavage en douceur.',
      'Applique une noisette de ton shampoing doux uniquement sur ton cuir chevelu par section.',
      'Masse délicatement du bout des doigts sans jamais frotter vigoureusement tes longueurs.',
      'Laisse couler la mousse protectrice sur tes longueurs pendant le rinçage à l\'eau tiède.'
    ],
    mistakes: [
      'Laver directement ses longueurs (cela décape et assèche inutilement la fibre capillaire).',
      'Utiliser de l\'eau brûlante qui agresse le scalp et stimule l\'excès de sébum par réaction.'
    ],
    products: 'Shampoing Doux Hydratant à l\'aloe vera ou co-wash purifiant.'
  },
  'Bain d\'huile': {
    title: '🌿 Bain d\'Huiles Chaudes Nourrissant',
    duration: '45 min',
    steps: [
      'Humidifie légèrement tes cheveux avec un spray d\'eau tiède pour faciliter la pénétration du soin.',
      'Applique ton mélange d\'huiles tiédies des racines jusqu\'aux pointes, section par section.',
      'Enveloppe tes cheveux dans une serviette chaude humide ou sous un bonnet auto-chauffant.',
      'Laisse poser entre 30 et 45 minutes, puis procède à ton shampoing doux protecteur.'
    ],
    mistakes: [
      'Appliquer l\'huile sur cheveux totalement secs (l\'huile bloque l\'hydratation au lieu de la retenir).',
      'Utiliser des huiles trop lourdes (comme le ricin pur) sans les diluer sur des cheveux fins.'
    ],
    products: 'Huile de Jojoba ou Sweet Almond (fins/faible poro) ; Huile d\'Avocat ou Ricin (épais/forte poro).'
  },
  'Masque hydratant': {
    title: '🍯 Masque Hydratant Profond & Miel',
    duration: '30 min',
    steps: [
      'Applique généreusement ton masque hydratant sur cheveux fraîchement lavés et encore humides.',
      'Répartis le soin à l\'aide de tes doigts ou d\'un peigne à dents larges pour bien lisser les cuticules.',
      'Laisse poser 20 à 30 minutes sous une source de chaleur douce (bonnet de douche ou serviette chaude).',
      'Rince très soigneusement à l\'eau fraîche pour refermer les écailles et booster la brillance.'
    ],
    mistakes: [
      'Laver son masque toute la nuit (risque majeur de saturation et d\'hygral fatigue).',
      'Négliger le rinçage (des résidus de masque peuvent étouffer le cheveu et le rendre poisseux).'
    ],
    products: 'Masque riche en aloe vera, miel, glycérine végétale ou graines de lin.'
  },
  'Masque protéiné': {
    title: '💪 Soin Reconstructeur Fortifiant Protéines',
    duration: '25 min',
    steps: [
      'Applique ton masque protéiné après ton shampoing sur tes cheveux essorés.',
      'Insiste particulièrement sur tes pointes abîmées, tes fourches et les zones fragilisées.',
      'Laisse poser entre 15 et 25 minutes (respecte bien le temps indiqué sur le produit).',
      'Rince abondamment et applique immédiatement après un leave-in ou lait très hydratant.'
    ],
    mistakes: [
      'Faire ce soin trop souvent (un excès de protéines durcit la fibre et provoque la casse).',
      'Oublier d\'hydrater ses cheveux juste après un traitement protéiné.'
    ],
    products: 'Masque à la kératine hydrolysée, protéines de soie, de blé ou d\'avoine.'
  },
  'Soin sans rinçage': {
    title: '💧 Lait Hydratant & Méthode L.O.C.',
    duration: '10 min',
    steps: [
      'Divise ta chevelure humide en plusieurs sections de taille égale.',
      'Applique une noisette de lait ou crème sans rinçage (Leave-In) sur chaque section humide.',
      'Masse délicatement tes longueurs pour faire pénétrer le soin hydratant en profondeur.',
      'Applique quelques gouttes d\'huile légère pour sceller l\'hydratation et retenir l\'eau.'
    ],
    mistakes: [
      'Appliquer trop de produit (cela alourdit la boucle et crée un effet carton).',
      'Faire ce soin sur cheveux secs sans vaporiser un peu d\'eau au préalable.'
    ],
    products: 'Lait capillaire fluide à l\'hibiscus ou leave-in léger aux protéines de soie.'
  },
  'Co-wash': {
    title: '🌸 Co-Wash Lavant Doux',
    duration: '10 min',
    steps: [
      'Mouille abondamment tes cheveux à l\'eau tiède.',
      'Applique une quantité généreuse de co-wash lavant des racines jusqu\'aux pointes.',
      'Masse ton cuir chevelu avec la pulpe de tes doigts pour émulsionner et décoller le sébum.',
      'Démêle délicatement tes longueurs à l\'aide de tes doigts, puis rince abondamment.'
    ],
    mistakes: [
      'Ne pas rincer assez (les résidus d\'agents conditionneurs peuvent irriter le cuir chevelu).',
      'Remplacer définitivement le shampoing clarifiant mensuel par du co-wash.'
    ],
    products: 'Crème lavante douce enrichie en coco ou après-shampoing certifié co-wash.'
  },
  'Retwist': {
    title: '👑 Retwist Roots & Aloe Vera Bio',
    duration: '60 min',
    steps: [
      'Lave et hydrate en profondeur tes locks avant de commencer le retwist.',
      'Sépare une mèche, applique une fine noisette de gel d\'aloe vera pur sur la racine neuve.',
      'Tourne délicatement la racine dans le sens des aiguilles d\'une montre entre tes paumes.',
      'Fixe la lock avec une pince en métal plate, puis laisse sécher complètement sous un casque.'
    ],
    mistakes: [
      'Utiliser des cires d\'abeille lourdes qui s\'incrustent à l\'intérieur des locks et créent des résidus.',
      'Serrer trop fort au niveau des racines (provoque une alopécie de traction et casse le bulbe).'
    ],
    products: 'Gel pur d\'Aloe Vera Bio purifié ou gel de graines de lin naturel fait maison.'
  },
  'Massage cuir chevelu': {
    title: '💆‍♀️ Massage Stimulateur de Pousse du Scalp',
    duration: '5 min',
    steps: [
      'Applique 3 à 4 gouttes de ton huile stimulante sur la pulpe de tes doigts.',
      'Place tes doigts sur ton cuir chevelu sous tes cheveux.',
      'Effectue des mouvements circulaires doux en décollant la peau (ne frotte pas les cheveux).',
      'Masse pendant 5 minutes en partant de la nuque et en remontant vers le sommet du crâne.'
    ],
    mistakes: [
      'Utiliser ses ongles (provoque des micro-lésions et irrite le scalp).',
      'Appuyer trop fort ou frotter directement les mèches entre elles (crée de la casse).'
    ],
    products: 'Sérum d\'huile de jojoba infusé au romarin, menthe poivrée ou tea tree.'
  }
};

interface SwipeableCareItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  isSwipeable: boolean;
  isLight: boolean;
}

const SwipeableCareItem: React.FC<SwipeableCareItemProps> = ({ children, onDelete, isSwipeable, isLight }) => {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const buttonWidth = 80;

  const isSwipeableRef = React.useRef(isSwipeable);
  React.useEffect(() => {
    isSwipeableRef.current = isSwipeable;
  }, [isSwipeable]);

const isOpenRef = React.useRef(false);

  const panResponder = React.useRef(
    PanResponder.create({
      // Never capture on initial press – only on deliberate horizontal move
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      // Tolerant horizontal detection: accept if |dx| > 5px AND dx is 2× larger than dy
      // This allows up to ~27° off-axis diagonal without cancelling the swipe.
      onMoveShouldSetPanResponder: (_, gs) => {
        if (!isSwipeableRef.current) return false;
        return Math.abs(gs.dx) > 5 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2;
      },
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        if (!isSwipeableRef.current) return false;
        return Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2.5;
      },

      // Prevent parent ScrollView from stealing the gesture once we own it
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, gs) => {
        let newX = isOpenRef.current ? gs.dx - buttonWidth : gs.dx;
        if (newX > 0) newX = 0;
        if (newX < -buttonWidth * 1.4) {
          newX = -buttonWidth * 1.4 + (newX + buttonWidth * 1.4) * 0.25;
        }
        translateX.setValue(newX);
      },

      onPanResponderRelease: (_, gs) => {
        const totalDx = isOpenRef.current ? gs.dx - buttonWidth : gs.dx;
        if (totalDx < -(buttonWidth * 0.3)) {
          Animated.spring(translateX, {
            toValue: -buttonWidth,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
          isOpenRef.current = true;
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
          isOpenRef.current = false;
        }
      },

      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
        isOpenRef.current = false;
      },
    })
  ).current;

  React.useEffect(() => {
    if (!isSwipeable) {
      translateX.setValue(0);
      isOpenRef.current = false;
    }
  }, [isSwipeable]);

  if (!isSwipeable) {
    return <View style={{ marginVertical: 6 }}>{children}</View>;
  }

  return (
    <View style={{ position: 'relative', overflow: 'hidden', marginVertical: 6, borderRadius: 16 }}>
      <View style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: buttonWidth,
        backgroundColor: colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
      }}>
        <TouchableOpacity
          onPress={() => {
            Animated.timing(translateX, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              onDelete();
            });
          }}
          activeOpacity={0.7}
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: 13,
            letterSpacing: 0.5,
          }}>
            Effacer
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={{
          transform: [{ translateX }],
          backgroundColor: isLight ? '#F5F6FA' : colors.background,
        }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

interface CalendarScreenProps {
  autoOpenAddModal?: boolean;
  onCloseAutoOpen?: () => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ autoOpenAddModal, onCloseAutoOpen }) => {
  const {
    activeProfile,
    routine,
    themeMode,
    addCustomRoutineItem,
    toggleRoutineCompleted,
    updateRoutineItemTime,
    deleteRoutineItem,
    bathroomProducts,
    addBathroomProduct,
    updateRoutineItemProduct
  } = useAppState();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateString());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  // Product selection modal states
  const [showProductSelectModal, setShowProductSelectModal] = useState(false);
  const [productSelectTargetCare, setProductSelectTargetCare] = useState<any>(null);
  const [productSelectOnConfirm, setProductSelectOnConfirm] = useState<((usedProduct?: { id: string; name: string; price: number }) => void) | null>(null);
  const [modalSelectedProductIds, setModalSelectedProductIds] = useState<string[]>([]);
  const [showQuickAddForm, setShowQuickAddForm] = useState(false);
  const [showNonListedOptions, setShowNonListedOptions] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddBrand, setQuickAddBrand] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('');
  const [quickAddPriceNR, setQuickAddPriceNR] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState('');
  const [quickAddImage, setQuickAddImage] = useState<string | undefined>(undefined);

  // Upcoming Care Product Assign States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetCareId, setAssignTargetCareId] = useState('');
  const [assignTargetCategory, setAssignTargetCategory] = useState('');
  const [assignAddCategory, setAssignAddCategory] = useState('');
  const [showAssignAddForm, setShowAssignAddForm] = useState(false);
  const [assignAddName, setAssignAddName] = useState('');
  const [assignAddBrand, setAssignAddBrand] = useState('');
  const [assignAddPrice, setAssignAddPrice] = useState('');
  const [assignAddPriceNR, setAssignAddPriceNR] = useState(false);
  const [assignAddImage, setAssignAddImage] = useState<string | undefined>(undefined);
  const [isSimulatingPhoto, setIsSimulatingPhoto] = useState(false);
  const [photoSimulationStep, setPhotoSimulationStep] = useState('');

  const launchAssignPicker = async (useGallery: boolean) => {
    try {
      const { status } = useGallery 
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
        
      if (status !== 'granted') {
        alert(
          useGallery 
            ? "Désolé, nous avons besoin de l'accès à la galerie photo."
            : "Désolé, nous avons besoin des permissions d'appareil photo."
        );
        return;
      }

      setIsSimulatingPhoto(true);
      setPhotoSimulationStep(useGallery ? "Chargement de la galerie..." : "Démarrage de l'appareil photo...");

      const result = useGallery
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

      setIsSimulatingPhoto(false);
      setPhotoSimulationStep('');

      if (!result.canceled && result.assets && result.assets[0]) {
        setAssignAddImage(result.assets[0].uri);
      }
    } catch (err: any) {
      setIsSimulatingPhoto(false);
      setPhotoSimulationStep('');
      console.error("Error launching picker:", err);
    }
  };

  const launchQuickAddPicker = async (useGallery: boolean) => {
    try {
      const { status } = useGallery 
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
        
      if (status !== 'granted') {
        alert(
          useGallery 
            ? "Désolé, nous avons besoin de l'accès à la galerie photo."
            : "Désolé, nous avons besoin des permissions d'appareil photo."
        );
        return;
      }
      
      const result = useGallery 
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setQuickAddImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Error launching quick add picker:", err);
    }
  };

  const getSelectedProductForCare = (careItem: any) => {
    if (careItem.selectedProductId === 'none') return null;
    if (careItem.selectedProductId) {
      const prod = bathroomProducts.find(bp => bp.id === careItem.selectedProductId);
      if (prod) return prod;
    }
    return bathroomProducts.find(bp => matchesCategory(bp.category, careItem.category, bp.name)) || null;
  };

  // Manual care addition modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [customCategory, setCustomCategory] = useState('Soin personnalisé');
  const [customProduct, setCustomProduct] = useState('');
  const [enableNotification, setEnableNotification] = useState(true);
  const [customDateStr, setCustomDateStr] = useState(selectedDateStr);
  const [manualError, setManualError] = useState('');
  const [showCareGuide, setShowCareGuide] = useState(false);
  const [selectedGuideCategory, setSelectedGuideCategory] = useState('');
  
  const [selectedCareId, setSelectedCareId] = useState<string>('');
  const getCurrentTimeRounded = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    if (roundedMinutes === 60) {
      minutes = 0;
      hours = (hours + 1) % 24;
    } else {
      minutes = roundedMinutes;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [manualReminderTime, setManualReminderTime] = useState(getCurrentTimeRounded());
  const [showManualTimePicker, setShowManualTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Side-effect to auto-open modal if navigated from HomeScreen bubble shortcut
  useEffect(() => {
    if (autoOpenAddModal) {
      const today = getLocalDateString();
      setSelectedDateStr(today);
      setCustomDateStr(today);
      setShowAddModal(true);
      if (onCloseAutoOpen) {
        onCloseAutoOpen();
      }
    }
  }, [autoOpenAddModal]);

  // Sync customDateStr with currently clicked selectedDateStr when modal is opened manually
  useEffect(() => {
    if (showAddModal) {
      setCustomDateStr(selectedDateStr);
      setManualReminderTime(getCurrentTimeRounded());
    }
  }, [showAddModal, selectedDateStr]);

  const getFriendlyFrenchDate = (dateStr: string): string => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (isNaN(dateObj.getTime())) return dateStr;
      
      const daysFrench = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const monthsFrench = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      
      const dayName = daysFrench[dateObj.getDay()];
      const monthName = monthsFrench[dateObj.getMonth()];
      
      return `${dayName} ${day} ${monthName} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleModifyDate = (daysOffset: number) => {
    const [year, month, day] = customDateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + daysOffset);
    
    const yStr = dateObj.getFullYear();
    const mStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const dStr = dateObj.getDate().toString().padStart(2, '0');
    
    setCustomDateStr(`${yStr}-${mStr}-${dStr}`);
  };

  const handleSetToday = () => {
    const today = new Date();
    const yStr = today.getFullYear();
    const mStr = (today.getMonth() + 1).toString().padStart(2, '0');
    const dStr = today.getDate().toString().padStart(2, '0');
    setCustomDateStr(`${yStr}-${mStr}-${dStr}`);
  };

  const handleSetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yStr = tomorrow.getFullYear();
    const mStr = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const dStr = tomorrow.getDate().toString().padStart(2, '0');
    setCustomDateStr(`${yStr}-${mStr}-${dStr}`);
  };

  if (!activeProfile) return null;

  const isLight = themeMode === 'light';
  const customBg = isLight ? '#F5F6FA' : colors.background;

  // Find active care item being viewed in the guide
  const activeCareItem = selectedCareId 
    ? routine.find(r => r.id === selectedCareId)
    : undefined;
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customInputBg = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)';
  const customInputBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  const compatibleProducts = productSelectTargetCare
    ? bathroomProducts.filter(bp => matchesCategory(bp.category, productSelectTargetCare.category, bp.name))
    : [];

  const renderAssignModalContent = () => {
    return showAssignAddForm ? (
      <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
        <View style={[styles.detailHeader, { marginBottom: 16 }]}>
          <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
            ➕ Nouveau produit pour ce soin
          </Text>
          <TouchableOpacity 
            style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
            onPress={() => setShowAssignAddForm(false)}
          >
            <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Upload Section */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          {assignAddImage ? (
            <Image source={{ uri: assignAddImage }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 8 }} />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: isLight ? '#F0F0F0' : '#303030', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>🧴</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(229,169,130,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
              onPress={() => launchAssignPicker(false)}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Appareil Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(229,169,130,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
              onPress={() => launchAssignPicker(true)}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Galerie</Text>
            </TouchableOpacity>
          </View>
          {isSimulatingPhoto && (
            <Text style={{ fontSize: 10, color: colors.primary, marginTop: 4 }}>{photoSimulationStep}</Text>
          )}
        </View>

        {/* Input Nom */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Nom du produit *</Text>
          <TextInput
            style={{
              backgroundColor: customInputBg,
              borderColor: customInputBorder,
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              color: customText,
              fontSize: 12,
            }}
            placeholder="Ex: Huile de Jojoba Pure"
            placeholderTextColor={isLight ? '#999999' : '#666666'}
            value={assignAddName}
            onChangeText={setAssignAddName}
          />
        </View>

        {/* Input Marque */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Marque *</Text>
          <TextInput
            style={{
              backgroundColor: customInputBg,
              borderColor: customInputBorder,
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              color: customText,
              fontSize: 12,
            }}
            placeholder="Ex: Aroma-Zone"
            placeholderTextColor={isLight ? '#999999' : '#666666'}
            value={assignAddBrand}
            onChangeText={setAssignAddBrand}
          />
        </View>

        {/* Prix & Checkbox */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Prix (€)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: assignAddPriceNR ? 'rgba(0,0,0,0.03)' : customInputBg,
                borderColor: customInputBorder,
                borderWidth: 1,
                borderRadius: 10,
                padding: 10,
                color: assignAddPriceNR ? customTextSec : customText,
                fontSize: 12,
              }}
              keyboardType="numeric"
              placeholder="Ex: 5.99"
              placeholderTextColor={isLight ? '#999999' : '#666666'}
              value={assignAddPrice}
              onChangeText={setAssignAddPrice}
              editable={!assignAddPriceNR}
            />
            
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              activeOpacity={0.8}
              onPress={() => setAssignAddPriceNR(!assignAddPriceNR)}
            >
              <View style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: assignAddPriceNR ? colors.primary : (isLight ? '#CCCCCC' : '#555555'),
                backgroundColor: assignAddPriceNR ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {assignAddPriceNR && <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 11, color: customTextSec }}>Renseigner plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fonction / Étape du soin */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Fonction / Étape du soin *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[
              { name: 'Lavage', emoji: '🧴' },
              { name: "Bain d'huile", emoji: '🌿' },
              { name: 'Masque hydratant', emoji: '🍯' },
              { name: 'Soin sans rinçage', emoji: '💧' },
              { name: 'Clarification', emoji: '🔬' },
              { name: 'Retwist', emoji: '👑' }
            ].map((cat) => {
              const isSelected = assignAddCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : customBorder,
                    backgroundColor: isSelected ? 'rgba(229,169,130,0.15)' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => setAssignAddCategory(cat.name)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? colors.primary : customText }}>
                    {cat.emoji} {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
              borderWidth: 1, 
              borderColor: customBorder, 
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
            }}
            onPress={() => setShowAssignAddForm(false)}
          >
            <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: colors.primary, 
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
              opacity: (!assignAddName.trim() || !assignAddBrand.trim() || !assignAddCategory) ? 0.5 : 1,
            }}
            disabled={!assignAddName.trim() || !assignAddBrand.trim() || !assignAddCategory}
            onPress={() => {
              const newProd = addBathroomProduct({
                name: assignAddName.trim(),
                brand: assignAddBrand.trim(),
                category: assignAddCategory,
                ingredients: [],
                compatibility: 'Compatible',
                score: 100,
                price: assignAddPriceNR ? undefined : parseFloat(assignAddPrice) || undefined,
                image: assignAddImage,
              });
              // Associate this newly created product to the care!
              updateRoutineItemProduct(assignTargetCareId, newProd.id);
              setShowAssignModal(false);
              setAssignTargetCareId('');
              setAssignTargetCategory('');
              setShowAssignAddForm(false);
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12, textAlign: 'center' }}>Enregistrer & Associer</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
        <View style={[styles.detailHeader, { marginBottom: 12 }]}>
          <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
            Associer un produit 🧴
          </Text>
          <TouchableOpacity 
            style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
            onPress={() => {
              setShowAssignModal(false);
              setAssignTargetCareId('');
              setAssignTargetCategory('');
              setShowAssignAddForm(false);
            }}
          >
            <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 12, color: customTextSec, marginBottom: 14 }}>
          Sélectionnez le produit de votre Salle de Bain à utiliser pour le soin : <Text style={{ color: colors.primary, fontWeight: '700' }}>{assignTargetCategory}</Text>
        </Text>

        <ScrollView style={{ maxHeight: 220, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
          {(() => {
            const compProducts = bathroomProducts.filter(bp => matchesCategory(bp.category, assignTargetCategory, bp.name));
            
            if (compProducts.length === 0) {
              return (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: customTextSec, textAlign: 'center', fontStyle: 'italic' }}>
                    ⚠️ Aucun produit compatible dans votre Salle de Bain.
                  </Text>
                </View>
              );
            }

            return (
              <View style={{ gap: 8 }}>
                {compProducts.map((prod) => {
                  const currentCare = routine.find(r => r.id === assignTargetCareId);
                  const isCurrentlyAssigned = currentCare?.selectedProductId === prod.id || 
                    (!currentCare?.selectedProductId && compProducts[0]?.id === prod.id); // Default match

                  return (
                    <TouchableOpacity
                      key={prod.id}
                      style={[
                        styles.productSelectCard,
                        { 
                          borderColor: isCurrentlyAssigned ? colors.primary : customBorder,
                          backgroundColor: isCurrentlyAssigned ? (isLight ? '#FFF9F4' : 'rgba(229,169,130,0.08)') : customCard,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginVertical: 4,
                        }
                      ]}
                      onPress={() => {
                        updateRoutineItemProduct(assignTargetCareId, prod.id);
                        setShowAssignModal(false);
                        setAssignTargetCareId('');
                        setAssignTargetCategory('');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: customText }} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <Text style={{ fontSize: 10, color: customTextSec }} numberOfLines={1}>
                          {prod.brand}
                        </Text>
                      </View>
                      {prod.price !== undefined && (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                          {prod.price.toFixed(2)} €
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })()}
        </ScrollView>

        {/* Ajouter un nouveau produit button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: isLight ? '#FFF3E8' : 'rgba(229,169,130,0.1)', 
            borderWidth: 1.5, 
            borderColor: colors.primary,
            borderStyle: 'dashed',
            marginBottom: 16,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => {
            setAssignAddName('');
            setAssignAddBrand('');
            setAssignAddPrice('');
            setAssignAddPriceNR(false);
            setAssignAddImage(undefined);
            setAssignAddCategory(assignTargetCategory);
            setShowAssignAddForm(true);
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>
            ➕ Ajouter & Associer un nouveau produit (Photo)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ 
            backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
            borderWidth: 1, 
            borderColor: customBorder, 
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
          }}
          onPress={() => {
            setShowAssignModal(false);
            setAssignTargetCareId('');
            setAssignTargetCategory('');
            setShowAssignAddForm(false);
          }}
        >
          <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>Fermer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProductSelectionModalContent = () => {
    if (!productSelectTargetCare) return null;

    if (showNonListedOptions) {
      return (
        <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
          <View style={[styles.detailHeader, { marginBottom: 16 }]}>
            <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
              🔍 Valider sans produit
            </Text>
            <TouchableOpacity 
              style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
              onPress={() => setShowNonListedOptions(false)}
            >
              <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, fontWeight: '700', color: customText, marginBottom: 16, textAlign: 'center' }}>
            Que souhaitez-vous faire ?
          </Text>

          {/* Option 1: Ajouter le produit */}
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
            activeOpacity={0.8}
            onPress={() => {
              setQuickAddName('');
              setQuickAddBrand('');
              setQuickAddPrice('');
              setQuickAddPriceNR(false);
              setQuickAddImage(undefined);
              setQuickAddCategory(productSelectTargetCare.category);
              setShowQuickAddForm(true);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
              ➕ Renseigner un autre produit
            </Text>
          </TouchableOpacity>

          {/* Option 2: Passer mon chemin */}
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(217, 83, 79, 0.08)',
              borderWidth: 1.5,
              borderColor: colors.danger,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
            activeOpacity={0.8}
            onPress={() => {
              setModalSelectedProductIds([]);
              if (productSelectOnConfirm) {
                productSelectOnConfirm(undefined);
              }
              setShowProductSelectModal(false);
              setProductSelectTargetCare(null);
              setProductSelectOnConfirm(null);
              setShowQuickAddForm(false);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 13 }}>
              🚶 Valider sans produit (Passer mon chemin)
            </Text>
          </TouchableOpacity>

          {/* Option 3: Retour */}
          <TouchableOpacity
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: customBorder,
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
            onPress={() => setShowNonListedOptions(false)}
          >
            <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>
              Retour
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (showQuickAddForm) {
      return (
        <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
          <View style={[styles.detailHeader, { marginBottom: 16 }]}>
            <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
              ➕ Nouveau produit
            </Text>
            <TouchableOpacity 
              style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
              onPress={() => setShowQuickAddForm(false)}
            >
              <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Photo Upload Section */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {quickAddImage ? (
              <Image source={{ uri: quickAddImage }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 8 }} />
            ) : (
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: isLight ? '#F0F0F0' : '#303030', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24 }}>🧴</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={{ backgroundColor: 'rgba(229,169,130,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                onPress={() => launchQuickAddPicker(false)}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Appareil Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ backgroundColor: 'rgba(229,169,130,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                onPress={() => launchQuickAddPicker(true)}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Nom */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Nom du produit *</Text>
            <TextInput
              style={{
                backgroundColor: customInputBg,
                borderColor: customInputBorder,
                borderWidth: 1,
                borderRadius: 10,
                padding: 10,
                color: customText,
                fontSize: 12,
              }}
              placeholder="Ex: Huile de Jojoba Pure"
              placeholderTextColor={isLight ? '#999999' : '#666666'}
              value={quickAddName}
              onChangeText={setQuickAddName}
            />
          </View>

          {/* Input Marque */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Marque *</Text>
            <TextInput
              style={{
                backgroundColor: customInputBg,
                borderColor: customInputBorder,
                borderWidth: 1,
                borderRadius: 10,
                padding: 10,
                color: customText,
                fontSize: 12,
              }}
              placeholder="Ex: Aroma-Zone"
              placeholderTextColor={isLight ? '#999999' : '#666666'}
              value={quickAddBrand}
              onChangeText={setQuickAddBrand}
            />
          </View>

          {/* Prix & Checkbox */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Prix (€)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: quickAddPriceNR ? 'rgba(0,0,0,0.03)' : customInputBg,
                  borderColor: customInputBorder,
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                  color: quickAddPriceNR ? customTextSec : customText,
                  fontSize: 12,
                }}
                keyboardType="numeric"
                placeholder="Ex: 5.99"
                placeholderTextColor={isLight ? '#999999' : '#666666'}
                value={quickAddPrice}
                onChangeText={setQuickAddPrice}
                editable={!quickAddPriceNR}
              />
              
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                activeOpacity={0.8}
                onPress={() => setQuickAddPriceNR(!quickAddPriceNR)}
              >
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: quickAddPriceNR ? colors.primary : (isLight ? '#CCCCCC' : '#555555'),
                  backgroundColor: quickAddPriceNR ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {quickAddPriceNR && <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={{ fontSize: 11, color: customTextSec }}>Renseigner plus tard</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fonction / Étape du soin */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Fonction / Étape du soin *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                { name: 'Lavage', emoji: '🧴' },
                { name: "Bain d'huile", emoji: '🌿' },
                { name: 'Masque hydratant', emoji: '🍯' },
                { name: 'Soin sans rinçage', emoji: '💧' },
                { name: 'Clarification', emoji: '🔬' },
                { name: 'Retwist', emoji: '👑' }
              ].map((cat) => {
                const isSelected = quickAddCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : customBorder,
                      backgroundColor: isSelected ? 'rgba(229,169,130,0.15)' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => setQuickAddCategory(cat.name)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? colors.primary : customText }}>
                      {cat.emoji} {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ 
                flex: 1, 
                backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
                borderWidth: 1, 
                borderColor: customBorder, 
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: 'center',
              }}
              onPress={() => setShowQuickAddForm(false)}
            >
              <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ 
                flex: 1, 
                backgroundColor: colors.primary, 
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: 'center',
                opacity: (!quickAddName.trim() || !quickAddBrand.trim() || !quickAddCategory) ? 0.5 : 1,
              }}
              disabled={!quickAddName.trim() || !quickAddBrand.trim() || !quickAddCategory}
              onPress={() => {
                const newProd = addBathroomProduct({
                  name: quickAddName.trim(),
                  brand: quickAddBrand.trim(),
                  category: quickAddCategory,
                  ingredients: [],
                  compatibility: 'Compatible',
                  score: 100,
                  price: quickAddPriceNR ? undefined : parseFloat(quickAddPrice) || undefined,
                  image: quickAddImage,
                });
                // Complete the care immediately with this new product!
                if (productSelectOnConfirm) {
                  productSelectOnConfirm({
                    id: newProd.id,
                    name: newProd.name,
                    price: newProd.price || 0
                  });
                }
                setShowProductSelectModal(false);
                setProductSelectTargetCare(null);
                setProductSelectOnConfirm(null);
                setShowQuickAddForm(false);
                setShowNonListedOptions(false);
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12, textAlign: 'center' }}>Enregistrer & Utiliser</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
        
        <View style={[styles.detailHeader, { marginBottom: 12 }]}>
          <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
            Choix du produit 🧴
          </Text>
          <TouchableOpacity 
            style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
            onPress={() => {
              setShowProductSelectModal(false);
              setProductSelectTargetCare(null);
              setProductSelectOnConfirm(null);
              setShowQuickAddForm(false);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 13, fontWeight: '700', color: customText, marginBottom: 14 }}>
          Quel produit de votre Salle de Bain avez-vous utilisé pour ce soin : {"\n"}
          <Text style={{ color: colors.primary }}>{productSelectTargetCare.category}</Text> ?
        </Text>

        <ScrollView style={{ maxHeight: 220, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
          {compatibleProducts.length > 0 ? (
            <View style={{ gap: 8 }}>
              {compatibleProducts.map((prod) => {
                const isSelected = modalSelectedProductIds.includes(prod.id);
                return (
                  <TouchableOpacity
                    key={prod.id}
                    style={[
                      styles.productSelectCard,
                      { 
                        borderColor: isSelected ? colors.primary : customBorder,
                        backgroundColor: isSelected ? (isLight ? '#FFF9F4' : 'rgba(229,169,130,0.08)') : customCard,
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginVertical: 4,
                      }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setModalSelectedProductIds(prev => prev.filter(id => id !== prod.id));
                      } else {
                        setModalSelectedProductIds(prev => [...prev, prod.id]);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <View style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.primary : (isLight ? '#CCCCCC' : '#555555'),
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}>
                        {isSelected && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: customText }} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <Text style={{ fontSize: 10, color: customTextSec }} numberOfLines={1}>
                          {prod.brand}
                        </Text>
                      </View>
                    </View>
                    {prod.price !== undefined && prod.price !== null ? (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                        {prod.price.toFixed(2)} €
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 9, fontWeight: '600', color: customTextSec, fontStyle: 'italic' }}>
                        Prix : N/R
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: customTextSec, textAlign: 'center', fontStyle: 'italic' }}>
                ⚠️ Aucun produit compatible trouvé dans votre Salle de Bain pour ce soin.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Ajouter un produit Button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: isLight ? '#FFF3E8' : 'rgba(229,169,130,0.1)', 
            borderWidth: 1.5, 
            borderColor: colors.primary,
            borderStyle: 'dashed',
            marginBottom: 10,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => {
            setQuickAddName('');
            setQuickAddBrand('');
            setQuickAddPrice('');
            setQuickAddPriceNR(false);
            setQuickAddImage(undefined);
            setQuickAddCategory(productSelectTargetCare.category);
            setShowQuickAddForm(true);
            setShowNonListedOptions(false);
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>
            ➕ Renseigner un autre produit
          </Text>
        </TouchableOpacity>

        {/* Produit non listé Button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: modalSelectedProductIds.length === 0 ? 'rgba(217, 83, 79, 0.08)' : 'transparent', 
            borderWidth: 1.5, 
            borderColor: modalSelectedProductIds.length === 0 ? colors.danger : customBorder,
            marginBottom: 16,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => {
            setModalSelectedProductIds([]);
            if (productSelectOnConfirm) {
              productSelectOnConfirm(undefined);
            }
            setShowProductSelectModal(false);
            setProductSelectTargetCare(null);
            setProductSelectOnConfirm(null);
            setShowQuickAddForm(false);
            setShowNonListedOptions(false);
          }}
        >
          <Text style={{ color: modalSelectedProductIds.length === 0 ? colors.danger : customTextSec, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>
            Valider sans produit ❌
          </Text>
        </TouchableOpacity>

        {/* Confirm / Cancel Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
              borderWidth: 1, 
              borderColor: customBorder, 
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
            }}
            onPress={() => {
              setShowProductSelectModal(false);
              setProductSelectTargetCare(null);
              setProductSelectOnConfirm(null);
              setShowQuickAddForm(false);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: colors.primary, 
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
            }}
            onPress={() => {
              if (productSelectOnConfirm) {
                let usedProduct: { id: string; name: string; price: number } | undefined = undefined;
                if (modalSelectedProductIds.length > 0) {
                  const selectedProducts = bathroomProducts.filter(bp => modalSelectedProductIds.includes(bp.id));
                  const ids = selectedProducts.map(p => p.id).join(',');
                  const names = selectedProducts.map(p => p.name).join(' + ');
                  const totalCost = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
                  usedProduct = { id: ids, name: names, price: totalCost };
                }
                productSelectOnConfirm(usedProduct);
              }
              setShowProductSelectModal(false);
              setProductSelectTargetCare(null);
              setProductSelectOnConfirm(null);
              setShowQuickAddForm(false);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>Confirmer</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  // Helper date conversions
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Grid math helpers
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0 index

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get status dots for a date string YYYY-MM-DD
  const getDateStatuses = (dateStr: string) => {
    const todayStr = getLocalDateString();
    const items = routine.filter(r => r.profileId === activeProfile.id && r.date === dateStr && !(r.completed && r.date < todayStr));
    
    let hasCompleted = false;
    let hasMissed = false;
    let hasUpcoming = false;

    items.forEach(r => {
      if (r.completed) {
        hasCompleted = true;
      } else if (dateStr < todayStr) {
        hasMissed = true;
      } else {
        hasUpcoming = true;
      }
    });

    return { hasCompleted, hasMissed, hasUpcoming };
  };

  const handleAddManualCare = () => {
    if (!showAddModal) return; // Prevent double submission
    if (!customProduct.trim()) {
      setManualError('Veuillez entrer le nom du soin/produit.');
      return;
    }

    // Validate the date format (AAAA-MM-JJ)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(customDateStr)) {
      setManualError('Format de date invalide. Veuillez utiliser le format AAAA-MM-JJ (ex: 2026-05-30).');
      return;
    }
    
    addCustomRoutineItem(customCategory, customProduct.trim(), customDateStr, enableNotification, enableNotification ? manualReminderTime : undefined);
    
    // Auto-select this planned date so the user sees their task in the list immediately!
    setSelectedDateStr(customDateStr);
    
    setCustomCategory('Soin personnalisé');
    setCustomProduct('');
    setEnableNotification(true);
    setManualReminderTime(getCurrentTimeRounded());
    setManualError('');
    setShowAddModal(false);

    if (Platform.OS === 'web') {
      window.alert('Soin ajouté au calendrier avec succès !');
    }
  };

  // RENDER GRID CELLS
  const renderMonthlyGrid = () => {
    const totalSlots = daysInMonth + firstDayIndex;
    const gridCells = [];

    // Prior Month Muted Days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      gridCells.push(
        <View key={`empty-${dayNum}`} style={styles.calendarDayCellMuted}>
          <Text style={[styles.dayTextMuted, { color: isLight ? '#BBB' : 'rgba(255,255,255,0.15)' }]}>{dayNum}</Text>
        </View>
      );
    }

    // Active Month Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDateStr === dateStr;
      const isToday = getLocalDateString() === dateStr;
      
      const { hasCompleted, hasMissed, hasUpcoming } = getDateStatuses(dateStr);

      gridCells.push(
        <TouchableOpacity
          key={`day-${day}`}
          activeOpacity={0.8}
          onPress={() => setSelectedDateStr(dateStr)}
          style={[
            styles.calendarDayCell,
            isSelected && [styles.selectedDayCell, { borderColor: colors.primary }],
            isToday && [styles.todayDayCell, { backgroundColor: isLight ? 'rgba(229,169,130,0.15)' : 'rgba(229,169,130,0.06)' }]
          ]}
        >
          <Text style={[
            styles.dayText, 
            { color: customText },
            isSelected && { fontWeight: '900', color: colors.primary },
            isToday && !isSelected && { color: colors.primary, fontWeight: '700' }
          ]}>
            {day}
          </Text>

          {/* Color coded indicators dots */}
          <View style={styles.indicatorDotsRow}>
            {hasCompleted && <View style={[styles.dot, { backgroundColor: colors.success }]} />}
            {hasMissed && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
            {hasUpcoming && <View style={[styles.dot, { backgroundColor: colors.warning }]} />}
          </View>
        </TouchableOpacity>
      );
    }

    return gridCells;
  };

  // RENDER WEEKLY SLIDER (Horizontal Row around selected day)
  const renderWeeklyRow = () => {
    const selectedDate = new Date(selectedDateStr);
    const cells = [];
    
    // Find the starting Monday of the selected day's week
    const dayOfWeek = (selectedDate.getDay() + 6) % 7; 
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(monday);
      weekDay.setDate(monday.getDate() + i);

      const dateStr = getLocalDateString(weekDay);
      const isSelected = selectedDateStr === dateStr;
      const isToday = getLocalDateString() === dateStr;
      const dayNum = weekDay.getDate();

      const { hasCompleted, hasMissed, hasUpcoming } = getDateStatuses(dateStr);

      cells.push(
        <TouchableOpacity
          key={`week-day-${i}`}
          activeOpacity={0.8}
          onPress={() => setSelectedDateStr(dateStr)}
          style={[
            styles.weeklyCell,
            { backgroundColor: customCard, borderColor: customBorder },
            isSelected && [styles.selectedWeeklyCell, { borderColor: colors.primary }],
            isToday && [styles.todayWeeklyCell, { backgroundColor: isLight ? 'rgba(229,169,130,0.15)' : 'rgba(229,169,130,0.06)' }]
          ]}
        >
          <Text style={[styles.weeklyLabelText, { color: customTextSec }]}>
            {weekdays[i]}
          </Text>
          <Text style={[
            styles.weeklyNumText,
            { color: customText },
            isSelected && { color: colors.primary, fontWeight: '900' },
            isToday && !isSelected && { color: colors.primary, fontWeight: '700' }
          ]}>
            {dayNum}
          </Text>

          {/* Dots */}
          <View style={styles.indicatorDotsRow}>
            {hasCompleted && <View style={[styles.dot, { backgroundColor: colors.success }]} />}
            {hasMissed && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
            {hasUpcoming && <View style={[styles.dot, { backgroundColor: colors.warning }]} />}
          </View>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  const todayStr = getLocalDateString();

  // Get active routines list for the selected date
  const activeDateRoutines = routine
    .filter(r => r.profileId === activeProfile.id && r.date === selectedDateStr && !(r.completed && r.date < todayStr))
    .sort((a, b) => {
      const wA = getCareOrderWeight(a.category);
      const wB = getCareOrderWeight(b.category);
      if (wA !== wB) return wA - wB;
      return b.id.localeCompare(a.id);
    });
  const isPastDate = selectedDateStr < todayStr;
  const isFutureDate = selectedDateStr > todayStr;

  // Find matching guide
  let guideKey = 'Lavage';
  if (selectedGuideCategory) {
    if (selectedGuideCategory.toLowerCase().includes('clarif')) guideKey = 'Clarification';
    else if (selectedGuideCategory.toLowerCase().includes('lavage')) guideKey = 'Lavage';
    else if (selectedGuideCategory.toLowerCase().includes('bain')) guideKey = 'Bain d\'huile';
    else if (selectedGuideCategory.toLowerCase().includes('hydratant')) guideKey = 'Masque hydratant';
    else if (selectedGuideCategory.toLowerCase().includes('protéin')) guideKey = 'Masque protéiné';
    else if (selectedGuideCategory.toLowerCase().includes('masque')) guideKey = 'Masque hydratant';
    else if (selectedGuideCategory.toLowerCase().includes('rinçage') || selectedGuideCategory.toLowerCase().includes('leave')) guideKey = 'Soin sans rinçage';
    else if (selectedGuideCategory.toLowerCase().includes('co-wash') || selectedGuideCategory.toLowerCase().includes('cowash')) guideKey = 'Co-wash';
    else if (selectedGuideCategory.toLowerCase().includes('retwist')) guideKey = 'Retwist';
    else if (selectedGuideCategory.toLowerCase().includes('massage') || selectedGuideCategory.toLowerCase().includes('cuir')) guideKey = 'Massage cuir chevelu';
  }
  
  const currentGuide = careGuidesMap[guideKey] || careGuidesMap['Lavage'];

  return (
    <View style={[styles.container, { backgroundColor: customBg }]}>
      {/* 🌓 HEADER CONTROLS */}
      <View style={[styles.headerSection, { backgroundColor: customCard, borderColor: customBorder }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: customText }]}>📅 Calendrier Capillaire</Text>
          
          {/* Segmented View Mode Toggle */}
          <View style={[styles.toggleContainer, { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)' }]}>
            <TouchableOpacity
              onPress={() => setViewMode('monthly')}
              style={[styles.toggleBtn, viewMode === 'monthly' && [styles.toggleBtnActive, { backgroundColor: colors.primary }]]}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'monthly' && styles.toggleBtnTextActive, { color: viewMode === 'monthly' ? colors.background : customTextSec }]}>Mensuel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('weekly')}
              style={[styles.toggleBtn, viewMode === 'weekly' && [styles.toggleBtnActive, { backgroundColor: colors.primary }]]}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'weekly' && styles.toggleBtnTextActive, { color: viewMode === 'weekly' ? colors.background : customTextSec }]}>Hebdo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MONTH SWITCHER (Only active in Monthly View) */}
        {viewMode === 'monthly' && (
          <View style={styles.monthSelectorRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
              <Text style={[styles.arrowText, { color: customTextSec }]}>◀</Text>
            </TouchableOpacity>
            <Text style={[styles.monthLabelText, { color: customText }]}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
              <Text style={[styles.arrowText, { color: customTextSec }]}>▶</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* CALENDAR RENDERING GRID */}
        {viewMode === 'monthly' ? (
          <View style={[styles.monthlyCalendarBox, { backgroundColor: customCard, borderColor: customBorder }]}>
            {/* Weekdays indicator row */}
            <View style={styles.weekdaysIndicatorRow}>
              {weekdays.map(d => (
                <Text key={d} style={[styles.weekdayLabel, { color: customTextSec }]}>{d}</Text>
              ))}
            </View>

            {/* Grid days */}
            <View style={styles.daysGrid}>
              {renderMonthlyGrid()}
            </View>
          </View>
        ) : (
          <View style={styles.weeklyBox}>
            <Text style={[styles.weeklyRangeTitle, { color: customTextSec }]}>
              Semaine du {selectedDateStr}
            </Text>
            <View style={styles.weeklyRowContainer}>
              {renderWeeklyRow()}
            </View>
          </View>
        )}

        {/* 🎨 COLOR LEGEND SUMMARY INDICATORS */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendLabel, { color: customTextSec }]}>Validé</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: colors.danger }]} />
            <Text style={[styles.legendLabel, { color: customTextSec }]}>Manqué</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: colors.warning }]} />
            <Text style={[styles.legendLabel, { color: customTextSec }]}>À venir</Text>
          </View>
        </View>

        {/* 📋 SELECTED DATE DETAIL PANEL */}
        <View style={[styles.detailPanel, { backgroundColor: customCard, borderColor: customBorder }]}>
          <View style={styles.panelHeaderRow}>
            <Text style={[styles.panelTitleText, { color: customText }]}>
              🗒️ Soins du {selectedDateStr === todayStr ? "Aujourd'hui" : selectedDateStr}
            </Text>
            
            {/* Manual future care scheduler button */}
            {(!isPastDate) && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.addCustomBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.addCustomBtnText}>➕ Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeDateRoutines.length > 0 && activeDateRoutines.some(item => item.completed || item.date < todayStr) && (
            <Text style={{
              fontSize: 11.5,
              color: colors.primary,
              fontStyle: 'italic',
              marginBottom: 12,
              textAlign: 'center',
              fontWeight: '600'
            }}>
              💡 Glisse un soin réalisé ou manqué vers la gauche pour l'effacer.
            </Text>
          )}

          {/* Tasks List */}
          {activeDateRoutines.length === 0 ? (
            <View style={styles.emptyTasksBox}>
              <Text style={[styles.emptyTasksText, { color: customTextSec }]}>
                Aucun soin programmé pour cette date. Laissez respirer la fibre ! 🌿
              </Text>
            </View>
          ) : (
            <View style={styles.taskListWrapper}>
              {activeDateRoutines.map(item => {
                const isCompleted = item.completed;
                const isMissed = !isCompleted && item.date < todayStr;
                const isUpcoming = !isCompleted && item.date >= todayStr;

                // Background & border dynamic styling
                let cardBg = customCard;
                let cardBorderColor = customBorder;
                
                if (isCompleted) {
                  cardBg = isLight ? '#EAF4EC' : 'rgba(92, 138, 107, 0.16)';
                  cardBorderColor = isLight ? '#CDE3D1' : 'rgba(92, 138, 107, 0.35)';
                } else if (isMissed) {
                  cardBg = isLight ? '#FDF2F2' : 'rgba(217, 83, 79, 0.1)';
                  cardBorderColor = isLight ? '#FAD2D2' : 'rgba(217, 83, 79, 0.25)';
                } else {
                  cardBg = customCard;
                  cardBorderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
                }

                // Checkbox status colors
                let checkboxBorderColor = colors.primary;
                let checkboxBg = 'transparent';
                if (isCompleted) {
                  checkboxBorderColor = colors.success;
                  checkboxBg = colors.success;
                } else if (isMissed) {
                  checkboxBorderColor = colors.danger;
                } else {
                  checkboxBorderColor = colors.primary;
                }

                const isSwipeable = isCompleted || isMissed;

                return (
                  <SwipeableCareItem
                    key={item.id}
                    isSwipeable={isSwipeable}
                    isLight={isLight}
                    onDelete={() => deleteRoutineItem(item.id)}
                  >
                    <View 
                      style={[
                        styles.taskCard,
                        { 
                          borderColor: cardBorderColor, 
                          backgroundColor: cardBg,
                          borderWidth: 1.5,
                          borderRadius: 16,
                          padding: 16,
                          marginVertical: 0,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }
                      ]}
                    >
                      <TouchableOpacity 
                        style={{ flex: 1, marginRight: 12 }}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedCareId(item.id);
                          setSelectedGuideCategory(item.category);
                          setShowCareGuide(true);
                        }}
                      >
                        {/* BOLD STATE BADGE */}
                        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                          {isCompleted && (
                            <View style={{
                              backgroundColor: isLight ? '#D0E9D5' : 'rgba(92, 138, 107, 0.3)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}>
                              <Text style={{
                                color: isLight ? '#2E693F' : '#82C394',
                                fontSize: 9.5,
                                fontWeight: '900',
                                letterSpacing: 0.5,
                              }}>
                                ✓ SOIN RÉALISÉ 🎉
                              </Text>
                            </View>
                          )}
                          {isMissed && (
                            <View style={{
                              backgroundColor: isLight ? '#FCE8E6' : 'rgba(217, 83, 79, 0.25)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}>
                              <Text style={{
                                color: isLight ? '#C92A2A' : '#FFA8A8',
                                fontSize: 9.5,
                                fontWeight: '900',
                                letterSpacing: 0.5,
                              }}>
                                ⚠️ EN RETARD (A FAIRE)
                              </Text>
                            </View>
                          )}
                          {isUpcoming && (
                            <View style={{
                              backgroundColor: isLight ? 'rgba(229, 169, 130, 0.15)' : 'rgba(229, 169, 130, 0.08)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              borderColor: 'rgba(229, 169, 130, 0.25)',
                              borderWidth: 0.5,
                            }}>
                              <Text style={{
                                color: colors.primary,
                                fontSize: 9.5,
                                fontWeight: '900',
                                letterSpacing: 0.5,
                              }}>
                                📅 SOIN PRÉVU à {item.reminderTime || activeProfile.notifications.time || '08:30'}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={[
                          styles.taskCategory, 
                          { color: customText },
                          isCompleted && { textDecorationLine: 'line-through', opacity: 0.7, fontStyle: 'italic' }
                        ]}>
                          {item.category}
                        </Text>
                        {(() => {
                          if (item.selectedProductId === 'none') {
                            return (
                              <Text style={[
                                styles.taskProduct, 
                                { color: colors.danger, fontWeight: '700' },
                                isCompleted && { opacity: 0.7, fontStyle: 'italic' }
                              ]}>
                                ❌ Aucun produit
                              </Text>
                            );
                          }
                          const matchingBathroomProduct = getSelectedProductForCare(item);
                          if (matchingBathroomProduct) {
                            return (
                              <Text style={[
                                styles.taskProduct, 
                                { color: isLight ? '#4D735F' : '#9CCCAE', fontWeight: '700' },
                                isCompleted && { opacity: 0.7, fontStyle: 'italic' }
                              ]}>
                                🧼 {matchingBathroomProduct.brand} • {matchingBathroomProduct.name}
                              </Text>
                            );
                          }
                          return (
                            <Text style={[
                              styles.taskProduct, 
                              { color: customTextSec },
                              isCompleted && { opacity: 0.7, fontStyle: 'italic' }
                            ]}>
                              {item.product}
                            </Text>
                          );
                        })()}
                        
                        <Text style={{ fontSize: 9.5, color: colors.secondary, fontWeight: '700', marginTop: 4 }}>
                          ⚡ Freq : {item.recurrence}
                          {item.enableNotificationReminder && (
                            <Text style={{ color: isLight ? '#555' : colors.textMuted, fontWeight: '600' }}>  •  🔔 Rappel activé</Text>
                          )}
                        </Text>
                      </TouchableOpacity>

                      {/* Checkbox Trigger */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.taskCheckbox,
                          { 
                            borderColor: checkboxBorderColor, 
                            backgroundColor: checkboxBg,
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            borderWidth: 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }
                        ]}
                        onPress={() => {
                          if (item.completed) {
                            toggleRoutineCompleted(item.id);
                          } else {
                            setProductSelectTargetCare(item);
                            const initialProd = getSelectedProductForCare(item);
                            setModalSelectedProductIds(initialProd ? [initialProd.id] : []);
                            setProductSelectOnConfirm(() => (usedProduct?: { id: string; name: string; price: number }) => {
                              toggleRoutineCompleted(item.id, usedProduct);
                            });
                            setShowProductSelectModal(true);
                          }
                        }}
                      >
                        {isCompleted && (
                          <Text style={{ 
                            color: '#FFFFFF', 
                            fontWeight: '900', 
                            fontSize: 15,
                            lineHeight: 18,
                          }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </SwipeableCareItem>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ➕ MANUAL FUTUR ACTION ADDITION MODAL */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={[styles.modalTitle, { color: customText }]}> Planifier un soin libre</Text>
            <Text style={[styles.modalSubtitle, { color: customTextSec }]}>
              Planifier manuellement un soin capillaire sur mesure.
            </Text>

            {manualError ? <Text style={styles.errorText}>{manualError}</Text> : null}

            {/* Category selection */}
            <View style={styles.inputField}>
              <Text style={[styles.fieldLabel, { color: customTextSec }]}>Catégorie de Soin</Text>
              <View style={styles.categoryPillsRow}>
                {['Lavage', 'Masque hydratant', 'Bain d\'huile', 'Soin sans rinçage', 'Clarification', 'Soin personnalisé'].map(cat => {
                  const isActive = customCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryPill,
                        { borderColor: customBorder },
                        isActive && [styles.categoryPillActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                      ]}
                      onPress={() => setCustomCategory(cat)}
                    >
                      <Text style={[
                        styles.categoryPillText, 
                        isActive && { color: colors.background, fontWeight: '700' },
                        !isActive && { color: customTextSec }
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tactile Date selection */}
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.fieldLabel, { color: customTextSec }]}>Date du soin</Text>
              <TouchableOpacity
                style={[
                  styles.textInput,
                  {
                    borderColor: customBorder,
                    backgroundColor: customInputBg,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16
                  }
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ color: customText, fontSize: 14, fontWeight: '700' }}>
                  📅 {getFriendlyFrenchDate(customDateStr)}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>Choisir ➔</Text>
              </TouchableOpacity>
            </View>

            {/* Tactile Hour selection */}
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.fieldLabel, { color: customTextSec }]}>Heure du rappel</Text>
              <TouchableOpacity
                style={[
                  styles.textInput,
                  {
                    borderColor: customBorder,
                    backgroundColor: customInputBg,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16
                  }
                ]}
                onPress={() => setShowManualTimePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ color: customText, fontSize: 14, fontWeight: '700' }}>
                  ⏰ {manualReminderTime}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>Choisir ➔</Text>
              </TouchableOpacity>
            </View>

            {/* Product description input */}
            <View style={styles.inputField}>
              <Text style={[styles.fieldLabel, { color: customTextSec }]}>Soin / Produit utilisé</Text>
              <TextInput
                style={[styles.textInput, { color: customText, borderColor: customBorder, backgroundColor: customInputBg }]}
                placeholder="Ex: Masque avocat bio ou Spray brume légère"
                placeholderTextColor={colors.textMuted}
                value={customProduct}
                onChangeText={setCustomProduct}
              />
            </View>

            {/* Notification reminder toggle Switch */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginVertical: 12,
              backgroundColor: customInputBg,
              borderColor: customBorder,
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: customText, fontWeight: '700' }}>
                    Activer la notification
                  </Text>
                  <Text style={{ fontSize: 9.5, color: customTextSec, marginTop: 1 }} numberOfLines={1}>
                    Rappel le {customDateStr} à {manualReminderTime}
                  </Text>
                </View>
              </View>
              <Switch
                value={enableNotification}
                onValueChange={setEnableNotification}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            <View style={styles.modalActionRow}>
              <Button
                title="Annuler"
                onPress={() => {
                  setShowAddModal(false);
                  setManualError('');
                }}
                variant="secondary"
                style={styles.modalBtnHalf}
              />
              <Button
                title="Planifier"
                onPress={handleAddManualCare}
                variant="primary"
                style={styles.modalBtnHalf}
              />
            </View>
          </View>

          {/* ⏰ MANUAL TIME PICKER OVERLAY */}
          <TimePickerModal
            visible={showManualTimePicker}
            initialTime={manualReminderTime}
            onClose={() => setShowManualTimePicker(false)}
            onSave={(time) => {
              setManualReminderTime(time);
            }}
            title="Rappel Soin Personnalisé ⏰"
            useNativeModal={false}
          />

          {/* 📅 DATE PICKER OVERLAY */}
          <DatePickerModal
            visible={showDatePicker}
            initialDate={customDateStr}
            onClose={() => setShowDatePicker(false)}
            onSave={(date) => {
              setCustomDateStr(date);
            }}
            title="Date du soin libre 📅"
            useNativeModal={false}
          />
        </View>
      </Modal>

      {/* 📖 DETAILED CARE GUIDE MODAL */}
      <Modal
        visible={showCareGuide}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCareGuide(false);
          setSelectedGuideCategory('');
          setSelectedCareId('');
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          {showProductSelectModal && productSelectTargetCare ? (
            renderProductSelectionModalContent()
          ) : showAssignModal ? (
            renderAssignModalContent()
          ) : (
            <View style={[styles.guideCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: customText, fontSize: 18 }]}>📖 Guide Pratique de Soin</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                onPress={() => {
                  setShowCareGuide(false);
                  setSelectedGuideCategory('');
                  setSelectedCareId('');
                }}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.guideScrollContent} showsVerticalScrollIndicator={false}>
              {/* Nom & Durée */}
              <View style={styles.guideTitleContainer}>
                <Text style={[styles.guideTitle, { color: colors.primary }]}>{currentGuide.title}</Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>⏱️ {currentGuide.duration}</Text>
                </View>
              </View>

              {/* Produits recommandés */}
              <View style={[styles.guideSectionBox, { backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)', borderColor: 'rgba(229, 169, 130, 0.15)' }]}>
                <Text style={styles.guideSectionHeader}>🧴 Produits recommandés pour toi :</Text>
                <Text style={[styles.guideSectionText, { color: customText }]}>
                  {currentGuide.products}
                </Text>
                <Text style={{ fontSize: 9.5, color: customTextSec, marginTop: 6, fontStyle: 'italic' }}>
                  *Personnalisé pour vos cheveux {activeProfile.diagnostic.texture} ({activeProfile.diagnostic.porosity || 'porosité non définie'}, épaisseur {activeProfile.diagnostic.thickness.toLowerCase()}).
                </Text>
              </View>

              {/* Produit prévu pour ce soin */}
              {activeCareItem && !activeCareItem.completed && (
                <View style={[styles.guideSectionBox, { borderColor: customBorder, marginTop: 4, padding: 14 }]}>
                  <Text style={styles.guideSectionHeader}>🧴 Produit prévu pour ce soin :</Text>
                  {(() => {
                    const associatedProduct = getSelectedProductForCare(activeCareItem);
                    if (associatedProduct) {
                      const isOcclusive = associatedProduct.ingredients.some(i => 
                        i.toLowerCase().includes('mineral oil') || 
                        i.toLowerCase().includes('petrolatum') || 
                        i.toLowerCase().includes('cire') || 
                        i.toLowerCase().includes('wax')
                      );
                      const isLowPoro = activeProfile.diagnostic.porosity === 'Faible';
                      const hasWarning = associatedProduct.compatibility === 'Attention' || (isOcclusive && isLowPoro);

                      return (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: customText, flex: 1, marginRight: 8 }}>
                              🧼 {associatedProduct.brand} • {associatedProduct.name}
                            </Text>
                            {associatedProduct.price !== undefined && (
                              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                {associatedProduct.price.toFixed(2)} €
                              </Text>
                            )}
                          </View>

                          {hasWarning ? (
                            <Text style={{ fontSize: 10.5, color: colors.danger, fontStyle: 'italic', marginTop: 2 }}>
                              ⚠️ Attention : ce produit contient des cires occlusives ou ingrédients lourds peu adaptés à ta porosité faible.
                            </Text>
                          ) : (
                            <Text style={{ fontSize: 10.5, color: isLight ? '#4D735F' : '#9CCCAE', fontStyle: 'italic', marginTop: 2 }}>
                              ✓ Produit compatible et idéal présent dans votre Salle de Bain.
                            </Text>
                          )}

                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                            <TouchableOpacity 
                              style={{ backgroundColor: 'rgba(229, 169, 130, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                              onPress={() => {
                                setAssignTargetCareId(activeCareItem.id);
                                setAssignTargetCategory(activeCareItem.category);
                                setAssignAddCategory(activeCareItem.category);
                                setAssignAddName('');
                                setAssignAddBrand('');
                                setAssignAddPrice('');
                                setAssignAddPriceNR(false);
                                setAssignAddImage(undefined);
                                setShowAssignAddForm(false);
                                setShowAssignModal(true);
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Remplacer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={{ backgroundColor: 'rgba(217, 83, 79, 0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                              onPress={() => {
                                updateRoutineItemProduct(activeCareItem.id, 'none');
                              }}
                            >
                              <Text style={{ color: colors.danger, fontSize: 11, fontWeight: '700' }}>Retirer</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    } else {
                      return (
                        <View style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 11, color: customTextSec, fontStyle: 'italic', marginBottom: 8 }}>
                            Aucun produit spécifique prévu (vous pourrez en sélectionner un lors de la validation).
                          </Text>
                          <TouchableOpacity 
                            style={{ backgroundColor: 'rgba(229, 169, 130, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' }}
                            onPress={() => {
                              setAssignTargetCareId(activeCareItem.id);
                              setAssignTargetCategory(activeCareItem.category);
                              setAssignAddCategory(activeCareItem.category);
                              setAssignAddName('');
                              setAssignAddBrand('');
                              setAssignAddPrice('');
                              setAssignAddPriceNR(false);
                              setAssignAddImage(undefined);
                              setShowAssignAddForm(false);
                              setShowAssignModal(true);
                            }}
                          >
                            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Associer un produit</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }
                  })()}
                </View>
              )}

              {/* Individual Care Reminder Hour Picker Row */}
              {activeCareItem && (
                <View style={[styles.guideSectionBox, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)', borderColor: customBorder, marginTop: 4, marginBottom: 12 }]}>
                  <Text style={styles.guideSectionHeader}>⏰ Heure de rappel pour ce soin :</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={[styles.guideSectionText, { color: customText, fontWeight: '700', fontSize: 13 }]}>
                      ⏰ {activeCareItem.reminderTime || activeProfile.notifications.time || '08:30'}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setShowTimePicker(true)}
                      style={{ backgroundColor: 'rgba(229, 169, 130, 0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Personnaliser ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Étapes numérotées */}
              <View style={styles.stepsContainer}>
                <Text style={[styles.guideSubtitle, { color: customText }]}>👣 Étapes à suivre :</Text>
                {currentGuide.steps.map((step, idx) => (
                  <View key={idx} style={styles.stepItemRow}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={[styles.stepItemText, { color: customTextSec }]}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Erreurs à éviter */}
              <View style={[styles.guideSectionBox, { backgroundColor: 'rgba(217, 83, 79, 0.04)', borderColor: 'rgba(217, 83, 79, 0.15)', marginTop: 12 }]}>
                <Text style={[styles.guideSectionHeader, { color: colors.danger }]}>⚠️ Erreurs courantes à éviter :</Text>
                {currentGuide.mistakes.map((mistake, idx) => (
                  <Text key={idx} style={[styles.guideSectionText, { color: customText, marginBottom: 4 }]}>
                    • {mistake}
                  </Text>
                ))}
              </View>
            </ScrollView>

            {/* CTA complete care */}
            <View style={styles.guideActionRow}>
              <Button
                title={
                  activeCareItem
                    ? (activeCareItem.completed ? "Soin déjà enregistré" : "Soin effectué")
                    : "Aucun soin prévu"
                }
                onPress={() => {
                  if (activeCareItem) {
                    setProductSelectTargetCare(activeCareItem);
                    const initialProd = getSelectedProductForCare(activeCareItem);
                    setModalSelectedProductIds(initialProd ? [initialProd.id] : []);
                    setProductSelectOnConfirm(() => (usedProduct?: { id: string; name: string; price: number }) => {
                      toggleRoutineCompleted(activeCareItem.id, usedProduct);
                      setShowCareGuide(false);
                      setSelectedGuideCategory('');
                      setSelectedCareId('');
                    });
                    setShowProductSelectModal(true);
                  }
                }}
                disabled={!activeCareItem || activeCareItem.completed}
                variant="primary"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Fermer"
                onPress={() => {
                  setShowCareGuide(false);
                  setSelectedGuideCategory('');
                  setSelectedCareId('');
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </View>
          )}

          {/* ⏰ INDIVIDUAL TIME PICKER OVERLAY */}
          {activeCareItem && (
            <TimePickerModal
              visible={showTimePicker}
              initialTime={getCurrentTimeRounded()}
              onClose={() => setShowTimePicker(false)}
              onSave={(time) => {
                updateRoutineItemTime(activeCareItem.id, time);
              }}
              title={`Heure du rappel : ${activeCareItem.category} ⏰`}
              useNativeModal={false}
            />
          )}
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    fontWeight: '800',
  },
  monthSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  arrowText: {
    fontSize: 12,
    fontWeight: '700',
  },
  monthLabelText: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  monthlyCalendarBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  weekdaysIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  calendarDayCellMuted: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.25,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextMuted: {
    fontSize: 13,
  },
  selectedDayCell: {
    borderRadius: 10,
    borderWidth: 1.5,
  },
  todayDayCell: {
    borderRadius: 10,
  },
  indicatorDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 6,
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 1,
  },
  weeklyBox: {
    marginBottom: 8,
  },
  weeklyRangeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  weeklyRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyCell: {
    flex: 1,
    aspectRatio: 0.7,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedWeeklyCell: {
    borderWidth: 1.5,
  },
  todayWeeklyCell: {
    borderWidth: 1,
  },
  weeklyLabelText: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  weeklyNumText: {
    fontSize: 16,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailPanel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  addCustomBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addCustomBtnText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTasksBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  taskListWrapper: {
    width: '100%',
  },
  taskCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  taskInfoWrapper: {
    flex: 1,
    marginRight: 16,
  },
  taskCategory: {
    fontSize: 14,
    fontWeight: '800',
  },
  taskProduct: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    fontWeight: '500',
  },
  taskRecurrence: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 4,
  },
  categoryPillActive: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalBtnHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  guideCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    height: '82%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  guideScrollContent: {
    paddingVertical: 12,
  },
  guideTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  durationBadge: {
    backgroundColor: 'rgba(92, 138, 107, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  durationText: {
    color: '#5C8A6B',
    fontSize: 11,
    fontWeight: '700',
  },
  guideSectionBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  guideSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  guideSectionText: {
    fontSize: 12,
    lineHeight: 18,
  },
  guideSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  stepsContainer: {
    marginBottom: 14,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepItemText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  guideActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDetailIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  productSelectCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
