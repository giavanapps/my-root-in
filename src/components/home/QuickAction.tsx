import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface QuickActionProps {
  onPress?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({ onPress }) => {
  const { activeProfile, themeMode } = useAppState();
  
  // Animation scale value
  const scaleValue = useRef(new Animated.Value(1)).current;

  if (!activeProfile) return null;

  const isLight = themeMode === 'light';
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;

  const handlePress = () => {
    // Micro-animation scale-down and scale-up spring
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleValue, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    // Fast feedback: call navigation callback immediately after scale-down completes (80ms)
    setTimeout(() => {
      if (onPress) {
        onPress();
      }
    }, 80);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedWrapper, { transform: [{ scale: scaleValue }] }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.actionButton,
            { 
              backgroundColor: customCard,
            }
          ]}
          onPress={handlePress}
        >
          <Text style={[styles.actionTitle, { color: customText }]}>MÉMO SOIN</Text>
          <Text style={[styles.actionSubtitle, { color: customTextSec }]}>
            Planifier un soin libre 📆
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
    paddingHorizontal: 24, // Aligns perfectly with marginHorizontal: 24 of other cards
  },
  animatedWrapper: {
    width: '100%',
  },
  actionButton: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: colors.secondary, // Green border matching health score
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle green glow shadow effect
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
});
