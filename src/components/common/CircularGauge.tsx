import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface CircularGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  onPress?: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  percentage = 0,
  size = 180,
  strokeWidth = 14,
  onPress,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { themeMode } = useAppState();
  const isLight = themeMode === 'light';
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const strokeBgColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: true, // safe with strokeDashoffset in modern react-native-svg
    }).start();
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Convert percentage to strokeDashoffset
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // Dynamic colors based on percentage
  const getGaugeColors = () => {
    if (percentage < 40) return { start: colors.danger, end: '#FF8A8A' };
    if (percentage < 70) return { start: colors.warning, end: '#F4D068' };
    return { start: colors.secondary, end: '#A7FFC9' };
  };

  const currentColors = getGaugeColors();

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress} 
      style={[styles.container, { width: size, height: size }]}
    >
      <View style={styles.shadowWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={currentColors.start} />
              <Stop offset="100%" stopColor={currentColors.end} />
            </LinearGradient>
          </Defs>
          
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeBgColor}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Glowing Outer Shadow (simulated in SVG) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentColors.start}
            strokeWidth={strokeWidth}
            strokeOpacity={0.15}
            fill="none"
          />

          {/* Active Percentage Circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gaugeGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Floating Percentage Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: customTextSec }]}>Jauge Santé</Text>
          <Text style={[styles.percentageText, { color: customText }]}>
            {Math.round(percentage)}%
          </Text>
          <Text style={[styles.statusText, { color: currentColors.start }]}>
            {percentage < 40 ? 'Critique' : percentage < 70 ? 'À hydrater' : 'Équilibré'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  shadowWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  percentageText: {
    fontSize: 38,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
