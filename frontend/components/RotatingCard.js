import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { PanResponder } from 'react-native';

export default function RotatingCard({ children, size = 260, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 6000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const rotateY = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '12deg'] });
  const rotateX = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-6deg'] });

  return (
    <Animated.View style={[styles.container, { transform: [{ rotateY }, { rotateX }], width: size, height: size }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden'
  }
});
