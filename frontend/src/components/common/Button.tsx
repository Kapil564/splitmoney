import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const containerStyles: any[] = [
    styles.base,
    styles[`${variant}Bg` as keyof typeof styles],
    styles[`${size}Size` as keyof typeof styles],
    disabled && styles.disabled,
    style,
  ];

  const labelStyles: any[] = [
    styles.label,
    styles[`${variant}Label` as keyof typeof styles],
    styles[`${size}Label` as keyof typeof styles],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={labelStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
  },
  disabled: { opacity: 0.5 },
  // Variants
  primaryBg: { backgroundColor: colors.primary },
  secondaryBg: { backgroundColor: colors.cardLight },
  outlineBg: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghostBg: { backgroundColor: 'transparent' },
  dangerBg: { backgroundColor: colors.error },
  // Labels
  label: { fontWeight: '600' },
  primaryLabel: { color: colors.textInverse },
  secondaryLabel: { color: colors.text },
  outlineLabel: { color: colors.primary },
  ghostLabel: { color: colors.primary },
  dangerLabel: { color: colors.white },
  // Sizes
  smallSize: { paddingVertical: 8, paddingHorizontal: 16 },
  mediumSize: { paddingVertical: 14, paddingHorizontal: 24 },
  largeSize: { paddingVertical: 18, paddingHorizontal: 32 },
  smallLabel: { fontSize: 13 },
  mediumLabel: { fontSize: 15 },
  largeLabel: { fontSize: 17 },
});
