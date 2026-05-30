import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface QuickActionProps {
  onPress?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({ onPress }) => {
  const { activeProfile } = useAppState();
  
  // Animation scale value
  const scaleValue = useRef(new Animated.Value(1)).current;

  if (!activeProfile) return null;

  const handlePress = () => {
    // Spring scale feedback animation
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleValue, { toValue: 1.1, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      if (onPress) {
        onPress();
      }
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.actionButton,
            styles.activeButton,
          ]}
          onPress={handlePress}
        >
          <View style={styles.innerContent}>
            <Text style={styles.actionEmoji}>✍️</Text>
            <Text style={styles.actionText}>
              Mémo Soin
            </Text>
            <Text style={[
              styles.actionSubtext,
              { color: 'rgba(11, 13, 23, 0.7)', fontSize: 9.5, marginTop: 6, lineHeight: 14 }
            ]}>
              Planifier un{"\n"}soin libre 📅
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  actionButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 4,
  },
  activeButton: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: colors.primary,
  },
  completedButton: {
    backgroundColor: colors.card,
    borderColor: 'rgba(92, 138, 107, 0.4)',
    shadowColor: colors.secondary,
  },
  innerContent: {
    alignItems: 'center',
    padding: 10,
  },
  actionEmoji: {
    fontSize: 34,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.background, // premium contrast
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(11, 13, 23, 0.7)',
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
