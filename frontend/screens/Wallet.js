import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GlassCard from '../components/GlassCard';
import { COLORS } from '../theme';
import * as Haptics from 'expo-haptics';
import { authenticate } from '../components/BiometricAuth';
import ConfettiCannon from 'react-native-confetti-cannon';
import Particles from '../components/Particles';
import particlesJson from '../assets/particles.json';
import confettiJson from '../assets/confetti.json';

export default function Wallet({ navigation }) {
  const onSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Dashboard');
  };

    const onBiometric = async () => {
      const ok = await authenticate();
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfetti(true);
        setTimeout(() => navigation.navigate('Dashboard'), 1200);
      }
    };

    const [showConfetti, setShowConfetti] = React.useState(false);

  return (
    <View style={styles.container}>
      <GlassCard style={styles.panel}>
        <Text style={styles.title}>Wallet</Text>
        <Text style={styles.balance}>—</Text>
        <TouchableOpacity style={styles.success} onPress={onBiometric}>
          <Text style={styles.successText}>Unlock with Biometrics</Text>
        </TouchableOpacity>
        {showConfetti && (
          <ConfettiCannon count={80} origin={{x: -10, y: 0}} fadeOut fallSpeed={3000} autoStart />
        )}
        <Particles source={particlesJson} />
      </GlassCard>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  panel: { width: '90%', padding: 20, alignItems: 'center' },
  title: { color: COLORS.text, fontSize: 20 },
  balance: { color: COLORS.primary, fontSize: 28, marginVertical: 12 },
  success: { backgroundColor: COLORS.secondary, padding: 12, borderRadius: 12 },
  successText: { color: '#04101A', fontWeight: '700' }
});
