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
  // Cozy Cream / Beige Theme for this block
  const cardBg = '#FAF5EC';
  const cardBorder = '#F1E4D0';
  const titleColor = '#3E2723';      // Marron très foncé
  const subtitleColor = '#6D4C41';   // Marron chaud moyen
  // Cozy icon container bg (slightly darker warm beige/cream)
  const iconBg = '#EADCC8';

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
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }
          ]}
          onPress={handlePress}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: iconBg }]}>
            <Text style={styles.actionIcon}>⚡</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: titleColor }]}>Soin express</Text>
            <Text style={[styles.actionSubtitle, { color: subtitleColor }]}>
              Planifier un soin libre
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    // Standard subtle card shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
});
