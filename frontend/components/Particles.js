import React from 'react';
import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';

export default function Particles({ source, style }) {
  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <LottieView source={source} autoPlay loop style={styles.lottie} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  lottie: { width: '100%', height: '100%' }
});
