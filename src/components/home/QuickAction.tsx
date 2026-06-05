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
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;

  const handlePress = () => {
    // Spring scale feedback animation
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleValue, { toValue: 1.02, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      if (onPress) {
        onPress();
      }
    });
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
              borderColor: customBorder,
              shadowColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)'
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
  },
  animatedWrapper: {
    width: '100%',
  },
  actionButton: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
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
