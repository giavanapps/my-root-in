import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import { Button } from './Button';

export const FeedbackSystem: React.FC = () => {
  const {
    showFeedbackQuiz,
    closeFeedbackQuiz,
    submitFeedback,
    showCareSummary,
    closeCareSummary,
    lastValidatedCare,
    lastFeedbackDelta,
    lastFeedbackReason,
    routine,
    activeProfile,
    themeMode,
  } = useAppState();

  if (!activeProfile) return null;

  const isLight = themeMode === 'light';
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customInputBg = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)';
  const overlayBg = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(11, 13, 23, 0.85)';

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* 💬 POP-UP Feedback Quiz Modal (Mini-Quiz Feedback) */}
      <Modal
        visible={showFeedbackQuiz}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFeedbackQuiz}
      >
        <View style={[styles.modalOverlay, { backgroundColor: overlayBg }]}>
          <View style={[styles.feedbackCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={[styles.feedbackEmoji, { color: customText }]}>Feedback 📝</Text>
            <Text style={[styles.feedbackTitle, { color: customText }]}>Comment se sentent tes cheveux après ce soin ?</Text>
            <Text style={[styles.feedbackSubtitle, { color: customTextSec }]}>
              Ta réponse permet d'ajuster intelligemment tes prochains soins et ta jauge de santé globale.
            </Text>

            <View style={styles.feedbackOptions}>
              {/* Option Dry */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.warning, backgroundColor: customInputBg }]}
                onPress={() => submitFeedback('Secs')}
              >
                <Text style={styles.optionEmojiText}>🌵</Text>
                <Text style={[styles.optionBtnLabel, { color: customText }]}>[ Secs ]</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Manque d'hydratation</Text>
              </TouchableOpacity>

              {/* Option Top */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.secondary, backgroundColor: customInputBg }]}
                onPress={() => submitFeedback('Top')}
              >
                <Text style={styles.optionEmojiText}>✨</Text>
                <Text style={[styles.optionBtnLabel, { color: customText }]}>[ Top ]</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Doux, brillants, parfaits</Text>
              </TouchableOpacity>

              {/* Option Heavy */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.primary, backgroundColor: customInputBg }]}
                onPress={() => submitFeedback('Lourds')}
              >
                <Text style={styles.optionEmojiText}>🏋️</Text>
                <Text style={[styles.optionBtnLabel, { color: customText }]}>[ Lourds ]</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Saturés, gras ou poisseux</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Passer"
              onPress={closeFeedbackQuiz}
              variant="outline"
              style={styles.closeFeedbackBtn}
            />
          </View>
        </View>
      </Modal>

      {/* 🏆 POST-FEEDBACK CARE SUMMARY MODAL */}
      <Modal
        visible={showCareSummary}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCareSummary}
      >
        <View style={[styles.modalOverlay, { backgroundColor: overlayBg }]}>
          <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: customText }]}>🏆 Soin Enregistré !</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                onPress={closeCareSummary}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailSubtitle, { color: customTextSec, marginBottom: 12 }]}>
              Félicitations pour avoir complété ta routine capillaire.
            </Text>

            {/* Care details info card */}
            <View style={[styles.feedbackOptionItem, { borderColor: customBorder, backgroundColor: customInputBg, marginVertical: 8, paddingVertical: 14 }]}>
              <Text style={styles.optionEmojiText}>🧴</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionBtnLabel, { color: customText, width: '100%' }]}>
                  {lastValidatedCare?.category || 'Soin Quotidien'}
                </Text>
                <Text style={{ fontSize: 11, color: customTextSec, marginTop: 2 }}>
                  Validé le {lastValidatedCare?.date || todayStr}
                </Text>
              </View>
            </View>

            {/* Gauge Impact animated box */}
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <Text style={{ fontSize: 12, color: customTextSec, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' }}>
                Impact sur la Jauge :
              </Text>
              <Text style={{ 
                fontSize: 34, 
                fontWeight: '900', 
                color: lastFeedbackDelta >= 0 ? '#5C8A6B' : colors.danger,
                marginTop: 6 
              }}>
                {lastFeedbackDelta >= 0 ? `+${lastFeedbackDelta}` : lastFeedbackDelta} pts
              </Text>
            </View>

            {/* Dynamic Advice Message based on delta/reason */}
            <View style={{
              backgroundColor: lastFeedbackDelta >= 0 ? 'rgba(92, 138, 107, 0.06)' : 'rgba(217, 83, 79, 0.06)',
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: lastFeedbackDelta >= 0 ? 'rgba(92, 138, 107, 0.2)' : 'rgba(217, 83, 79, 0.2)',
              padding: 14,
              marginBottom: 16
            }}>
              <Text style={{
                color: lastFeedbackDelta >= 0 ? colors.secondary : colors.danger,
                fontWeight: '700',
                fontSize: 12,
                marginBottom: 4,
                textTransform: 'uppercase'
              }}>
                Ajustement & Conseils :
              </Text>
              <Text style={{ fontSize: 12, color: customText, lineHeight: 18, marginBottom: 8, fontWeight: '600' }}>
                {lastFeedbackReason}
              </Text>
              <Text style={{ fontSize: 12, color: customText, lineHeight: 18 }}>
                {lastFeedbackReason.includes('Secs') && 
                  "Tes cheveux manquent d'hydratation 💧 Un soin sans rinçage hydratant et léger a été adapté ou programmé dans ton agenda à venir pour relancer la jauge."
                }
                {lastFeedbackReason.includes('Top') && 
                  "Parfait ! Ton cuir chevelu et tes longueurs adorent cette routine 🌿 Ton score de régularité progresse ! (+5 pts de santé)."
                }
                {lastFeedbackReason.includes('Lourds') && 
                  "Tes cheveux étouffent sous le poids des produits 😬 Une clarification détox douce a été injectée dans ton agenda et tes prochains soins lourds/gras ont été décalés pour laisser respirer la fibre."
                }
                {!lastFeedbackReason.includes('Secs') && !lastFeedbackReason.includes('Top') && !lastFeedbackReason.includes('Lourds') &&
                  "Routine complétée avec succès ! Prends soin de toi au quotidien."
                }
              </Text>
            </View>

            {/* Next scheduled care reminder */}
            {(() => {
              const nextCare = routine
                .filter(r => r.profileId === activeProfile.id && !r.completed && r.date >= todayStr && r.date !== lastValidatedCare?.date)
                .sort((a, b) => a.date.localeCompare(b.date))[0];
              
              if (!nextCare) return null;

              return (
                <View style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 12,
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderColor: customBorder,
                  borderWidth: 1,
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>📅</Text>
                  <Text style={{ fontSize: 11.5, color: customTextSec, flex: 1 }}>
                    Prochain soin : <Text style={{ fontWeight: '700', color: colors.primary }}>{nextCare.category}</Text> ({nextCare.product}) le <Text style={{ fontWeight: '700' }}>{nextCare.date}</Text>
                  </Text>
                </View>
              );
            })()}

            <Button
              title="Fermer"
              onPress={closeCareSummary}
              variant="primary"
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  feedbackCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  feedbackEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
  },
  feedbackSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 16,
  },
  feedbackOptions: {
    width: '100%',
    marginBottom: 16,
  },
  feedbackOptionItem: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  optionEmojiText: {
    fontSize: 22,
    marginRight: 12,
  },
  optionBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    width: 80,
  },
  optionDescText: {
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  closeFeedbackBtn: {
    width: '100%',
    marginTop: 6,
  },
  detailCard: {
    borderRadius: 28,
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
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: '700',
  },
  detailSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
});
