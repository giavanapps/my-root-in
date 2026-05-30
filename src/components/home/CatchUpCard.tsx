import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

export const CatchUpCard: React.FC = () => {
  const { catchUpTask, handleCatchUp, themeMode } = useAppState();

  if (!catchUpTask) return null; // Only render conditionally

  const isLight = themeMode === 'light';
  const customCard = isLight ? '#FFF0E8' : '#1E1B24'; // Warm tinted background for alert card
  const customBorder = isLight ? 'rgba(226, 149, 120, 0.4)' : 'rgba(226, 149, 120, 0.25)';
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBtnNoBorder = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)';

  return (
    <View style={[styles.container, { backgroundColor: customCard, borderColor: customBorder }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.alertEmoji}>⏳</Text>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.titleText}>Soin manqué détecté !</Text>
          <Text style={[styles.subTitleText, { color: customTextSec }]}>
            As-tu réalisé ton soin "{catchUpTask.category}" hier ({catchUpTask.product}) ?
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.btn, styles.btnYes]}
          onPress={() => handleCatchUp(true)}
        >
          <Text style={styles.btnYesText}>Oui, fait !</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.btn, styles.btnNo, { borderColor: customBtnNoBorder }]}
          onPress={() => handleCatchUp(false)}
        >
          <Text style={[styles.btnNoText, { color: customTextSec }]}>Non, zappé</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1B24', // Warm purple slate for alerts
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 149, 120, 0.25)', // Muted orange highlight border
    padding: 16,
    marginHorizontal: 24,
    marginVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  alertEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  headerTextWrapper: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.warning,
  },
  subTitleText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnYes: {
    backgroundColor: colors.secondary, // Green
    marginRight: 8,
  },
  btnYesText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  btnNo: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 8,
  },
  btnNoText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
