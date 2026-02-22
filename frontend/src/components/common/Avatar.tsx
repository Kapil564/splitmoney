import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
  uri?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 42, color }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const bg = color || getColorForName(name);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
};

const getColorForName = (name: string): string => {
  const palette = ['#FF6B6B', '#5B9BD5', '#00D09E', '#FFB347', '#AB47BC', '#FF7043', '#26C6DA', '#66BB6A'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontWeight: '700' },
});
