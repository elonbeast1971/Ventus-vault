import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

export default function GlassCard({ children, style }) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={60} tint="dark" style={styles.blur}>
        <LinearGradient
          colors={[ 'rgba(20,245,184,0.06)', 'transparent' ]}
          style={styles.inner}
        >
          {children}
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    margin: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  blur: {
    padding: 16
  },
  inner: {
    borderRadius: 20,
    padding: 8
  }
});
