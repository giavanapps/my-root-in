import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface DynamicHeaderProps {
  onPriorityPress?: () => void;
}

export const DynamicHeader: React.FC<DynamicHeaderProps> = ({ onPriorityPress }) => {
  const { activeProfile, routine, themeMode, regularityScore } = useAppState();

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

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.welcomeWrapper}>
          <Text style={[styles.greetingText, { color: customTextSec }]}>Bonjour,</Text>
          <Text style={[styles.nameText, { color: customText }]}>{activeProfile.name} {activeProfile.avatar}</Text>
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
        
        {/* Style Badge */}
        <View style={styles.styleBadge}>
          <Text style={styles.styleBadgeText}>{activeProfile.diagnostic.activeStyle}</Text>
        </View>
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
  styleBadge: {
    backgroundColor: 'rgba(229, 169, 130, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 130, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  styleBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
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
});
