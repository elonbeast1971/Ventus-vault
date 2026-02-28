import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GlassCard from '../components/GlassCard';
import { COLORS } from '../theme';
import RotatingCard from '../components/RotatingCard';
import ConfettiCannon from 'react-native-confetti-cannon';
import Particles from '../components/Particles';

const confettiJson = require('../assets/confetti.json');
const particlesJson = require('../assets/particles.json');

export default function GiftCard({ navigation }) {
  const [showConfetti, setShowConfetti] = React.useState(false);

  const onCashout = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);
  };

  return (
    <View style={styles.container}>
      <Particles source={particlesJson} />
      <RotatingCard style={styles.rotator}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Spin & Win</Text>
          <TouchableOpacity style={styles.cta} onPress={onCashout}>
            <Text style={styles.ctaText}>Instant Cashout</Text>
          </TouchableOpacity>
        </GlassCard>
      </RotatingCard>
      {showConfetti && <ConfettiCannon count={80} origin={{x: 0, y: 0}} fadeOut />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  card: { width: '90%', padding: 24, alignItems: 'center' },
  title: { color: COLORS.text, fontSize: 20, marginBottom: 16 },
  cta: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14 },
  ctaText: { color: '#04101A', fontWeight: '700' }
});
