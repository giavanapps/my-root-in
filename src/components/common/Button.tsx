import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return [styles.btn, styles.primary, disabled && styles.disabled, style];
      case 'secondary':
        return [styles.btn, styles.secondary, disabled && styles.disabled, style];
      case 'outline':
        return [styles.btn, styles.outline, disabled && styles.disabled, style];
      case 'danger':
        return [styles.btn, styles.danger, disabled && styles.disabled, style];
      default:
        return [styles.btn, styles.primary, disabled && styles.disabled, style];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return [styles.text, styles.textOutline, textStyle];
      case 'secondary':
        return [styles.text, styles.textSecondary, textStyle];
      case 'danger':
        return [styles.text, styles.textDanger, textStyle];
      default:
        return [styles.text, styles.textSolid, textStyle];
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={getButtonStyles()}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.textPrimary} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginVertical: 6,
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSolid: {
    color: colors.background, // contrast on primary/gold/secondary/danger
  },
  textOutline: {
    color: colors.primary,
  },
  textSecondary: {
    color: colors.textPrimary,
  },
  textDanger: {
    color: colors.textPrimary,
  },
});
