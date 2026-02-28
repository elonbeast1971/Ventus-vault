import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AnimatedLogo from '../components/AnimatedLogo';
import AuthStorage from '../lib/AuthStorage';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await AuthStorage.getToken();
      if (!mounted) return;
      const next = token ? 'Dashboard' : 'Login';
      setTimeout(() => navigation.replace(next), 900);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <AnimatedLogo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
