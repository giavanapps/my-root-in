import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface DynamicHeaderProps {
  onPriorityPress?: () => void;
}

const getMockedWeather = (dateStr: string) => {
  // Stable hash based on date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 4; // 4 conditions: 0=Humide/Pluie, 1=Sec/Froid, 2=Soleil/Chaud, 3=Vent/Sec
  switch (index) {
    case 0:
      return { condition: 'Pluie/Humide 🌧️', icon: '🌧️', humidity: 85, temp: 17 };
    case 1:
      return { condition: 'Froid/Sec ❄️', icon: '❄️', humidity: 30, temp: 4 };
    case 2:
      return { condition: 'Soleil/Chaud ☀️', icon: '☀️', humidity: 45, temp: 28 };
    default:
      return { condition: 'Venteux/Sec 💨', icon: '💨', humidity: 40, temp: 19 };
  }
};

const getWeatherAdvice = (texture: string, weatherIcon: string): string => {
  if (texture === 'Crépus') {
    if (weatherIcon === '🌧️') {
      return "Forte humidité aujourd'hui ! Privilégie des coiffures protectrices (tresses, vanilles) ou utilise une gelée/beurre lourd pour sceller ton hydratation et limiter la rétraction (shrinkage).";
    }
    if (weatherIcon === '❄️') {
      return "Air très sec et froid. Sortie obligatoire avec un bonnet en satin (ou doublé satin) et mise le paquet sur une crème riche avant de sortir.";
    }
    if (weatherIcon === '☀️') {
      return "Indice UV élevé. Applique un beurre coiffant dense (comme le karité) pour sceller l'hydratation et faire écran contre le soleil.";
    }
    return "Temps sec et poussiéreux. Applique un leave-in hydratant léger et fais un chignon serré (pineapple) pour limiter la prise au vent.";
  }

  if (texture === 'Frisés') {
    if (weatherIcon === '🌧️') {
      return "Humidité en hausse ! Évite les produits trop légers à base d'eau pure ou de glycérine (qui attire l'humidité extérieure). Utilise un gel fixant pour \"verrouiller\" le dessin de tes boucles.";
    }
    if (weatherIcon === '❄️') {
      return "Froid sec. Tes boucles peuvent devenir rêches. Hydrate-les avec un lait capillaire fluide et scelle avec quelques gouttes d'huile d'avocat.";
    }
    if (weatherIcon === '☀️') {
      return "Indice UV élevé. Applique un soin protecteur anti-UV ou une huile végétale légère (comme l'huile de karanja ou de pépins de framboise) pour faire écran contre le soleil.";
    }
    return "Vent sec. Risque de frisottis mousseux ! Protège ton dessin de boucle avec un voile de laque naturelle ou de gel de coiffage.";
  }

  if (texture === 'Locksés') {
    if (weatherIcon === '🌧️') {
      return "Alerte humidité. Si tu laves tes locks aujourd'hui, le séchage à l'air libre est interdit. Sèche-cheveux obligatoire, surtout au niveau des racines et du cœur des locks !";
    }
    if (weatherIcon === '❄️') {
      return "Air sec et froid. Tes locks risquent de s'assécher aux pointes. Fais une légère brumisation d'eau de rose suivie d'une noisette d'huile de jojoba.";
    }
    if (weatherIcon === '☀️') {
      return "Soleil persistant. Les UV ternissent la couleur de tes locks. Vaporise un spray protecteur léger avec un filtre solaire et hydrate bien ton cuir chevelu.";
    }
    return "Temps venteux et sec. Protège tes locks avec un foulard ou un wrap aujourd'hui pour éviter que la poussière et les résidus de pollution ne s'incrustent dans tes longueurs.";
  }

  if (texture === 'Bouclés') {
    if (weatherIcon === '🌧️') {
      return "Forte humidité. Les boucles peuvent perdre de leur définition. Utilise un gel de graines de lin ou une gelée de définition pour figer les boucles sans effet carton.";
    }
    if (weatherIcon === '❄️') {
      return "Vent froid. Les boucles s'assèchent vite. Fais un scellage léger avec de l'huile d'argan et porte un bonnet en satin.";
    }
    if (weatherIcon === '☀️') {
      return "Soleil intense. Protège tes boucles avec un spray protecteur d'hydratation et évite l'exposition directe prolongée.";
    }
    return "Vent sec. Tes boucles s'emmêlent facilement. Utilise un spray démêlant sans rinçage et évite de les laisser totalement libres.";
  }

  if (texture === 'Ondulés') {
    if (weatherIcon === '🌧️') {
      return "Humidité en vue. Les cheveux ondulés risquent de se détendre et de frisotter. Utilise une mousse légère ou un gel léger pour maintenir les ondulations.";
    }
    if (weatherIcon === '❄️') {
      return "Froid et air sec. Protège tes ondulations contre le frottement des vêtements avec une huile sèche légère (comme le jojoba).";
    }
    if (weatherIcon === '☀️') {
      return "Soleil radieux. Cheveux ondulés faciles à dessécher. Utilise un spray hydratant sans rinçage léger avant de t'exposer.";
    }
    return "Vent fort. Tes ondulations vont s'ébouriffer et s'emmêler. Fais une demi-queue ou une tresse lâche pour les maintenir en place.";
  }

  // Raides or default
  if (weatherIcon === '🌧️') {
    return "Temps humide. Les cheveux lisses peuvent perdre leur volume et paraître plats. Évite les huiles lourdes aujourd'hui et privilégie un shampoing sec volumateur.";
  }
  if (weatherIcon === '❄️') {
    return "Air très sec. Risque d'électricité statique ! Utilise un après-shampoing hydratant léger et passe un peigne en bois.";
  }
  if (weatherIcon === '☀️') {
    return "Plein soleil. Les UV agressent la kératine. Applique un spray protecteur thermo-actif léger.";
  }
  return "Vent poussiéreux. Brosse tes cheveux lisses avec une brosse en poils de sanglier pour éliminer la poussière incrustée.";
};

export const DynamicHeader: React.FC<DynamicHeaderProps> = ({ onPriorityPress }) => {
  const { activeProfile, routine, themeMode, regularityScore, isPremium, setPremiumStatus } = useAppState();
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  if (!activeProfile) return null;

  const isLight = themeMode === 'light';
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;

  // Find today's uncompleted task
  const todayStr = new Date().toISOString().split('T')[0];
  const isFirstDay = activeProfile.createdAt === todayStr;
  const todayAction = routine.find(
    r => r.profileId === activeProfile.id && r.date === todayStr && !r.completed
  );

  const weather = getMockedWeather(todayStr);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.welcomeWrapper}>
          <Text style={[styles.greetingText, { color: customTextSec }]}>Bonjour,</Text>
          <Text style={[styles.nameText, { color: customText }]}>{activeProfile.name}</Text>
          {/* Dynamic Color-Coded Consistency Score */}
          {(() => {
            let scoreColor = colors.secondary; // green (>= 85)
            let scoreEmoji = '🎯';
            if (regularityScore < 50) {
              scoreColor = isLight ? colors.danger : colors.warning; // red/orange alert
              scoreEmoji = '🌿';
            } else if (regularityScore < 85) {
              scoreColor = isLight ? '#A8572A' : colors.accent; // terracotta/gold
              scoreEmoji = '✨';
            }
            return (
              <Text style={{ color: scoreColor, marginTop: 4, fontWeight: '700', fontSize: 13 }}>
                {scoreEmoji} Score de régularité : {regularityScore}%
              </Text>
            );
          })()}
        </View>
        
        {/* Météo Capillaire Widget */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setShowWeatherModal(true)}
          style={[styles.weatherWidget, { backgroundColor: isLight ? '#F5F7FA' : 'rgba(255, 255, 255, 0.05)', borderColor: customBorder }]}
        >
          <Text style={styles.weatherIcon}>{weather.icon}</Text>
          <Text style={[styles.weatherText, { color: customText }]}>{weather.humidity}% HR</Text>
        </TouchableOpacity>
      </View>

      {/* Priority Action Message Banner */}
      <TouchableOpacity 
        activeOpacity={todayAction && !isFirstDay ? 0.8 : 1}
        disabled={!todayAction || isFirstDay}
        onPress={onPriorityPress}
        style={[styles.priorityBanner, { backgroundColor: customCard, borderColor: customBorder }]}
      >
        <View style={styles.bannerIndicator} />
        <View style={styles.bannerTextWrapper}>
          <Text style={[styles.priorityLabel, { color: customTextSec }]}>Priorité du jour :</Text>
          <Text style={[styles.priorityActionText, { color: customText }]}>
            {isFirstDay
              ? "Bienvenue ! Ta routine commence demain. Profite d'aujourd'hui pour découvrir tes conseils personnalisés 🌿"
              : todayAction 
                ? `${todayAction.category} (${todayAction.product})` 
                : 'Aucun soin programmé aujourd\'hui. Laissez respirer ! 🌿'}
          </Text>
        </View>
        {todayAction && !isFirstDay ? (
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>➔</Text>
        ) : null}
      </TouchableOpacity>

      {/* 🌤️ Météo Capillaire Modal */}
      <Modal
        visible={showWeatherModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWeatherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isLight ? '#FFFFFF' : colors.card, borderColor: customBorder }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: customText }]}>🌤️ Météo Capillaire du Jour</Text>
              <TouchableOpacity 
                onPress={() => setShowWeatherModal(false)}
                style={[styles.closeButton, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]}
              >
                <Text style={{ color: customTextSec, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Weather status details */}
            <View style={[styles.weatherStatusCard, { backgroundColor: isLight ? '#F9F9FB' : 'rgba(255, 255, 255, 0.02)', borderColor: customBorder }]}>
              <Text style={styles.statusIcon}>{weather.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusLabel, { color: customText }]}>Temps : {weather.condition}</Text>
                <Text style={[styles.statusDetails, { color: customTextSec }]}>Température : {weather.temp}°C | Humidité : {weather.humidity}%</Text>
              </View>
            </View>

            {/* Advice section */}
            {isPremium ? (
              <View style={styles.adviceWrapper}>
                <View style={[styles.adviceHeaderBadge, { backgroundColor: 'rgba(118, 160, 138, 0.1)' }]}>
                  <Text style={[styles.adviceHeaderBadgeText, { color: colors.secondary }]}>
                    ✨ Conseil Premium ({activeProfile.diagnostic.texture})
                  </Text>
                </View>
                <Text style={[styles.adviceText, { color: customText }]}>
                  {getWeatherAdvice(activeProfile.diagnostic.texture, weather.icon)}
                </Text>
              </View>
            ) : (
              <View style={styles.lockedWrapper}>
                <View style={styles.lockedHeader}>
                  <Text style={styles.lockEmoji}>🔒</Text>
                  <Text style={[styles.lockedTitle, { color: customText }]}>Conseil Météo Personnalisé Bloqué</Text>
                </View>
                <Text style={[styles.lockedSubtitle, { color: customTextSec }]}>
                  Débloquez les conseils météo en temps réel adaptés à la texture de vos cheveux ({activeProfile.diagnostic.texture}) pour protéger vos longueurs des agressions extérieures (humidité, froid sec, UV, vent).
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.premiumUpgradeBtn}
                  onPress={() => {
                    setPremiumStatus(true);
                  }}
                >
                  <Text style={styles.premiumUpgradeBtnText}>Activer My Root'In Premium 🚀</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeWrapper: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  weatherWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  weatherIcon: {
    fontSize: 16,
  },
  weatherText: {
    fontSize: 12,
    fontWeight: '800',
  },
  priorityBanner: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIndicator: {
    width: 4,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  bannerTextWrapper: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 36,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  adviceWrapper: {
    gap: 12,
  },
  adviceHeaderBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adviceHeaderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  lockedWrapper: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockEmoji: {
    fontSize: 20,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  lockedSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  premiumUpgradeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  premiumUpgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
