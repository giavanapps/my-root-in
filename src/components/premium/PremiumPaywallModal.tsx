import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface PremiumPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenScanner?: () => void; // Optional callback to trigger scanner from paywall
}

export const PremiumPaywallModal: React.FC<PremiumPaywallModalProps> = ({ visible, onClose, onOpenScanner }) => {
  const { themeMode, setPremiumStatus, isPremium, activeProfile } = useAppState();
  const isDark = themeMode === 'dark';

  const [activePreview, setActivePreview] = useState<'inci' | 'add' | 'compare' | 'diy' | null>(null);

  const handleSimulatePurchase = () => {
    setPremiumStatus(true);
  };

  const handleFeatureClick = (type: 'inci' | 'add' | 'compare' | 'diy') => {
    setActivePreview(type);
  };

  const benefits = [
    {
      type: 'inci' as const,
      icon: '🔬',
      title: 'Analyse INCI & Diagnostic IA',
      desc: 'Analyse moléculaire de la formule INCI et diagnostic complet (Pour/Contre) adapté à tes cuticules. [Prévisualiser ➔]',
    },
    {
      type: 'add' as const,
      icon: '📅',
      title: 'Agenda Proactif & Cabinet Virtuel',
      desc: 'Range tes flacons dans Ma Salle de Bain et laisse l\'IA injecter automatiquement des soins suggérés dans ton calendrier. [Prévisualiser ➔]',
    },
    {
      type: 'compare' as const,
      icon: '🧐',
      title: 'Comparateur Anti-Gaspillage',
      desc: 'Scan en rayon pour détecter instantanément si tu possèdes déjà un produit équivalent à la maison. [Prévisualiser ➔]',
    },
    {
      type: 'diy' as const,
      icon: '🌿',
      title: 'Alternative Naturelle DIY (Dupe Végétal)',
      desc: 'Conçois des recettes végétales saines (plantes, poudres, huiles) sur-mesure pour ton type de cheveu. [Prévisualiser ➔]',
    },
  ];

  const chartData = [
    { week: 'Sem 1', score: 62 },
    { week: 'Sem 3', score: 68 },
    { week: 'Sem 5', score: 72 },
    { week: 'Sem 7', score: 78 },
    { week: 'Sem 9', score: 85 },
    { week: 'Sem 11', score: 92 },
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.badge}>💎 MODE PREMIUM</Text>
              {isPremium && (
                <Text style={styles.premiumActiveBadge}>ACTIF ✓</Text>
              )}
            </View>
            <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]}>
              Débloque ton Coach Root'in Premium 🌿
            </Text>
            <Text style={[styles.subtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Prends soin de ta couronne de locks et cheveux crépus avec nos technologies d'analyse avancées.
            </Text>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Benefits List */}
            <Text style={[styles.sectionSubtitle, isDark ? styles.textLight : styles.textDark]}>
              ✨ Clique sur une option ci-dessous pour y accéder :
            </Text>

            {benefits.map((b, i) => (
              <TouchableOpacity 
                key={i} 
                style={[
                  styles.benefitCard,
                  isDark ? styles.benefitCardDark : styles.benefitCardLight,
                  activePreview === b.type && styles.benefitCardSelected
                ]}
                activeOpacity={0.7}
                onPress={() => handleFeatureClick(b.type)}
              >
                <Text style={styles.benefitIcon}>{b.icon}</Text>
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, isDark ? styles.textLight : styles.textDark]}>
                    {b.title}
                  </Text>
                  <Text style={[styles.benefitDesc, activePreview === b.type ? styles.highlightText : (isDark ? styles.textMutedDark : styles.textMutedLight)]}>
                    {b.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* INTERACTIVE PREVIEW PANEL */}
            {activePreview && (
              <View style={[
                styles.previewContainer,
                isDark ? styles.previewContainerDark : styles.previewContainerLight
              ]}>
                
                {/* 🔬 INCI PREVIEW */}
                {activePreview === 'inci' && (
                  <View>
                    <Text style={styles.previewTitle}>🔬 Prévisualisation : Diagnostic INCI IA</Text>
                    <Text style={[styles.previewDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      Scanne la formule INCI et obtiens une note précise et un rapport personnalisé des ingrédients adaptés ou à éviter.
                    </Text>

                    {/* Simulated Score Card */}
                    <View style={styles.simulatedViewfinder}>
                      <View style={styles.viewfinderLaser} />
                      <Text style={styles.viewfinderText}>Mélange Moringa & Coco détecté...</Text>
                      <Text style={styles.viewfinderBadge}>COMPATIBLE À 94% (BOUCLÉS) ✓</Text>
                    </View>

                    {isPremium ? (
                      <TouchableOpacity 
                        style={styles.previewButton}
                        onPress={() => {
                          setActivePreview(null);
                          onClose();
                          if (onOpenScanner) onOpenScanner();
                        }}
                      >
                        <Text style={styles.previewButtonText}>Ouvrir le Scanner Réel 🚀</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lockedCallout}>
                        <Text style={styles.lockedCalloutText}>
                          🔒 Active l'accès Premium ci-dessous pour débloquer l'analyse INCI réelle de tes flacons !
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 📅 PROACTIVE AGENDA PREVIEW */}
                {activePreview === 'add' && (
                  <View>
                    <Text style={styles.previewTitle}>📅 Prévisualisation : Agenda Proactif</Text>
                    <Text style={[styles.previewDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      Associe tes flacons virtuels à ton calendrier. L'IA Root'in injecte de manière dynamique des instructions intelligentes.
                    </Text>

                    {/* Protocol Steps Preview */}
                    <View style={styles.protocolPreviewBox}>
                      <Text style={styles.protocolStepText}>🗓️ Soin Lavage (12 Juin) : Shampoing Actiforce 🧴</Text>
                      <Text style={styles.protocolStepText}>🗓️ Soin Lavage (19 Juin) : Shampoing Actiforce 🧴</Text>
                    </View>

                    {isPremium ? (
                      <TouchableOpacity 
                        style={styles.previewButton}
                        onPress={() => {
                          setActivePreview(null);
                          onClose();
                          if (onOpenScanner) onOpenScanner();
                        }}
                      >
                        <Text style={styles.previewButtonText}>Ouvrir le Scanner Réel 🚀</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lockedCallout}>
                        <Text style={styles.lockedCalloutText}>
                          🔒 Débloque l'Agenda Proactif pour coupler tes flacons avec ton calendrier capillaire !
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 🧐 COMPARATOR PREVIEW */}
                {activePreview === 'compare' && (
                  <View>
                    <Text style={styles.previewTitle}>🧐 Prévisualisation : Comparateur Magasin</Text>
                    <Text style={[styles.previewDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      Flashe un produit en magasin pour savoir s'il est doublon avec un flacon existant déjà dans ton placard.
                    </Text>

                    <View style={[styles.protocolPreviewBox, { backgroundColor: 'rgba(217, 83, 79, 0.05)', borderColor: 'rgba(217, 83, 79, 0.15)' }]}>
                      <Text style={[styles.protocolStepText, { color: colors.danger }]}>🚨 NE L'ACHÈTE PAS !</Text>
                      <Text style={{ fontSize: 11, color: '#A0A5C0', lineHeight: 14 }}>
                        Ton produit <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Cantu Styling Wax</Text> fait exactement la même chose pour ton profil. Économie réalisée !
                      </Text>
                    </View>

                    {isPremium ? (
                      <TouchableOpacity 
                        style={styles.previewButton}
                        onPress={() => {
                          setActivePreview(null);
                          onClose();
                          if (onOpenScanner) onOpenScanner();
                        }}
                      >
                        <Text style={styles.previewButtonText}>Ouvrir le Scanner Réel 🚀</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lockedCallout}>
                        <Text style={styles.lockedCalloutText}>
                          🔒 Utilise le comparateur anti-gaspillage en magasin pour économiser immédiatement !
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 🌿 DUPE DIY PREVIEW */}
                {activePreview === 'diy' && (
                  <View>
                    <Text style={styles.previewTitle}>🌿 Prévisualisation : Dupe Végétal DIY</Text>
                    <Text style={[styles.previewDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      Génère une alternative végétale 100% saine et naturelle de n'importe quel produit industriel.
                    </Text>

                    <View style={[styles.protocolPreviewBox, { backgroundColor: 'rgba(118, 160, 138, 0.05)', borderColor: 'rgba(118, 160, 138, 0.15)' }]}>
                      <Text style={[styles.protocolStepText, { color: colors.secondary }]}>🍃 Dupe : Gel de Gombo & Aloe Vera</Text>
                      <Text style={{ fontSize: 10, color: '#A0A5C0', lineHeight: 13 }}>
                        Ingrédients : Gombos frais coupés, Aloe Vera, Huile de Jojoba.
                      </Text>
                    </View>

                    {isPremium ? (
                      <TouchableOpacity 
                        style={styles.previewButton}
                        onPress={() => {
                          setActivePreview(null);
                          onClose();
                          if (onOpenScanner) onOpenScanner();
                        }}
                      >
                        <Text style={styles.previewButtonText}>Ouvrir le Scanner Réel 🚀</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lockedCallout}>
                        <Text style={styles.lockedCalloutText}>
                          🔒 Génère des fiches recettes végétales adaptées à tes boucles ou locks !
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.closePreviewButton}
                  onPress={() => setActivePreview(null)}
                >
                  <Text style={styles.closePreviewButtonText}>✕ Fermer cette prévisualisation</Text>
                </TouchableOpacity>
              </View>
            )}

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
            {!isPremium ? (
              <TouchableOpacity 
                style={styles.subscribeButton} 
                activeOpacity={0.9}
                onPress={handleSimulatePurchase}
              >
                <Text style={styles.subscribeButtonText}>Commencer mon essai de 7 jours 🚀</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.premiumActiveFooter}>
                <Text style={styles.premiumActiveFooterText}>🎉 Tu es déjà membre Premium Root'in !</Text>
              </View>
            )}

            {/* Developer Secret Bypass Section */}
            {!isPremium && (
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
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.cancelButtonText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Retour à l'application
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
    height: '94%',
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
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accent,
    backgroundColor: 'rgba(230, 198, 135, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  premiumActiveBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
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
  benefitCardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(229, 169, 130, 0.03)',
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  // INTERACTIVE PREVIEWS styles
  previewContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  previewContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewContainerLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  previewDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: spacing.md,
  },
  simulatedViewfinder: {
    backgroundColor: '#000000',
    height: 120,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: spacing.md,
  },
  viewfinderLaser: {
    position: 'absolute',
    left: '5%',
    width: '90%',
    height: 2,
    backgroundColor: '#76A08A',
    top: 60,
  },
  viewfinderText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    zIndex: 2,
  },
  viewfinderBadge: {
    color: '#76A08A',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: spacing.xs,
    zIndex: 2,
  },
  protocolPreviewBox: {
    backgroundColor: 'rgba(118, 160, 138, 0.05)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    borderColor: 'rgba(118, 160, 138, 0.15)',
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: 6,
  },
  protocolStepText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  sosSuccessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(92, 138, 107, 0.1)',
    borderRadius: borderRadius.sm,
    borderColor: '#5C8A6B',
    borderWidth: 1,
  },
  sosSuccessText: {
    color: '#5C8A6B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  previewButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#0B0D17',
    fontSize: 13,
    fontWeight: 'bold',
  },
  lockedCallout: {
    backgroundColor: 'rgba(230, 198, 135, 0.08)',
    borderColor: 'rgba(230, 198, 135, 0.2)',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  lockedCalloutText: {
    color: colors.accent,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  // ADVANCED HEALTH CHART styles
  chartWrapper: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartYAxis: {
    width: 32,
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 22,
  },
  chartAxisLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  chartGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarTrack: {
    height: 70,
    width: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 7,
  },
  chartAxisXText: {
    color: colors.textMuted,
    fontSize: 8,
    marginTop: spacing.xs,
    fontWeight: 'bold',
  },
  chartBarValueText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  chartAiAdvice: {
    fontSize: 11,
    color: '#76A08A',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 14,
  },
  closePreviewButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  closePreviewButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  // PRICING CARDS styles
  pricingSection: {
    marginTop: spacing.lg,
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
    fontSize: 15,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 15,
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
  premiumActiveFooter: {
    backgroundColor: 'rgba(118, 160, 138, 0.15)',
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  premiumActiveFooterText: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 14,
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
    fontSize: 13,
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
