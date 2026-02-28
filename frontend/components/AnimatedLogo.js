import React, { useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function AnimatedLogo({ size = 120 }) {
  const scale = new Animated.Value(0.85);
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, { transform: [{ scale }] , width: size, height: size }]}> 
        <View style={[styles.v]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  logo: {
    borderRadius: 24,
    backgroundColor: 'rgba(20,245,184,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20
  },
  v: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary
  }
});
