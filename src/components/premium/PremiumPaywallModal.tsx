import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface PremiumPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumPaywallModal: React.FC<PremiumPaywallModalProps> = ({ visible, onClose }) => {
  const { themeMode, setPremiumStatus } = useAppState();
  const isDark = themeMode === 'dark';

  const handleSimulatePurchase = () => {
    setPremiumStatus(true);
    onClose();
  };

  const benefits = [
    {
      icon: '🔍',
      title: 'Scanner Capillaire IA (INCI)',
      desc: 'Scanne la liste des ingrédients de n\'importe quel produit et découvre sa compatibilité avec ta texture et porosité.',
    },
    {
      icon: '🚨',
      title: 'SOS Booster Illimité',
      desc: 'Accès sans limites aux protocoles d\'urgence intensifs en cas de casse importante ou sécheresse extrême.',
    },
    {
      icon: '📈',
      title: 'Suivi de Santé Avancé',
      desc: 'Historique illimité de l\'évolution de tes jauges d\'hydratation, nutrition et régularité.',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          isDark ? styles.containerDark : styles.containerLight
        ]}>
          {/* Header Accent Bar */}
          <View style={styles.accentBar} />

          <View style={styles.header}>
            <Text style={styles.badge}>💎 MODE PREMIUM</Text>
            <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]}>
              Débloque ton Coach Root'in Premium 🌿
            </Text>
            <Text style={[styles.subtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Prends soin de ta couronne de locks et cheveux crépus avec nos technologies d'analyse avancées.
            </Text>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Benefits List */}
            {benefits.map((b, i) => (
              <View 
                key={i} 
                style={[
                  styles.benefitCard,
                  isDark ? styles.benefitCardDark : styles.benefitCardLight
                ]}
              >
                <Text style={styles.benefitIcon}>{b.icon}</Text>
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, isDark ? styles.textLight : styles.textDark]}>
                    {b.title}
                  </Text>
                  <Text style={[styles.benefitDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    {b.desc}
                  </Text>
                </View>
              </View>
            ))}

            {/* Pricing Section */}
            <View style={styles.pricingSection}>
              <TouchableOpacity 
                style={[
                  styles.planCard,
                  styles.planCardActive,
                  isDark ? styles.planCardDark : styles.planCardLight
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.planBadgeContainer}>
                  <Text style={styles.planBadgeText}>RECOMMANDÉ</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={[styles.planTitle, isDark ? styles.textLight : styles.textDark]}>Annuel</Text>
                  <Text style={[styles.planPrice, styles.highlightText]}>39,99 € / an</Text>
                </View>
                <Text style={[styles.planPeriod, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Soit 3,33 €/mois • Économise 44% • 7 jours d'essai gratuit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.planCard,
                  isDark ? styles.planCardDark : styles.planCardLight
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planTitle, isDark ? styles.textLight : styles.textDark]}>Mensuel</Text>
                  <Text style={[styles.planPrice, isDark ? styles.textLight : styles.textDark]}>5,99 € / mois</Text>
                </View>
                <Text style={[styles.planPeriod, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Annulable à tout moment • 7 jours d'essai gratuit
                </Text>
              </TouchableOpacity>
            </View>

            {/* Simulated Buy Button */}
            <TouchableOpacity 
              style={styles.subscribeButton} 
              activeOpacity={0.9}
              onPress={handleSimulatePurchase}
            >
              <Text style={styles.subscribeButtonText}>Commencer mon essai de 7 jours 🚀</Text>
            </TouchableOpacity>

            {/* Developer Secret Bypass Section */}
            <View style={[
              styles.devSection,
              isDark ? styles.devSectionDark : styles.devSectionLight
            ]}>
              <Text style={styles.devTitle}>🛠️ Espace de Test Collaborateurs</Text>
              <Text style={styles.devDesc}>
                Simule instantanément un achat premium pour débloquer Firestore local et Vercel en 1 clic.
              </Text>
              <TouchableOpacity 
                style={styles.devButton} 
                activeOpacity={0.8}
                onPress={handleSimulatePurchase}
              >
                <Text style={styles.devButtonText}>🔑 Activer Root'in Premium</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.cancelButtonText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Plus tard
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 13, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.md,
    maxHeight: '92%',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  containerDark: {
    backgroundColor: '#0E111F',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
  },
  accentBar: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent,
    backgroundColor: 'rgba(230, 198, 135, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  benefitCardDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  benefitCardLight: {
    backgroundColor: '#F7F8FA',
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  pricingSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  planCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    position: 'relative',
  },
  planCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planCardLight: {
    backgroundColor: '#FAFBFC',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  planCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  planBadgeContainer: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    color: '#0B0D17',
    fontSize: 9,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 11,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  subscribeButtonText: {
    color: '#0B0D17',
    fontSize: 15,
    fontWeight: 'bold',
  },
  devSection: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  devSectionDark: {
    backgroundColor: 'rgba(230, 198, 135, 0.03)',
    borderColor: 'rgba(230, 198, 135, 0.25)',
  },
  devSectionLight: {
    backgroundColor: 'rgba(230, 198, 135, 0.06)',
    borderColor: 'rgba(230, 198, 135, 0.45)',
  },
  devTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 2,
  },
  devDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 14,
  },
  devButton: {
    backgroundColor: 'rgba(230, 198, 135, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  devButtonText: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  highlightText: {
    color: colors.primary,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#0E111F',
  },
  textMutedDark: {
    color: colors.textSecondary,
  },
  textMutedLight: {
    color: '#6E728C',
  },
});
