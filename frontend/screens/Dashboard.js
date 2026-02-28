import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import GlassCard from '../components/GlassCard';
import { COLORS } from '../theme';
import RotatingCard from '../components/RotatingCard';
import Particles from '../components/Particles';

const particlesJson = require('../assets/particles.json');

export default function Dashboard({ navigation }) {
  return (
    <View style={styles.container}>
      <Particles source={particlesJson} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Good evening — welcome back</Text>
        <GlassCard style={styles.aiCard}>
          <Text style={styles.aiTitle}>AI Suggestions</Text>
          <Text style={styles.aiText}>Hello! No recent activity — try trading BTC.</Text>
        </GlassCard>

        <GlassCard>
          <View style={styles.row}>
            <View>
              <Text style={styles.small}>Live BTC</Text>
              <Text style={styles.rate}>—</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Wallet')}>
              <Text style={styles.buttonText}>Open Wallet</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <RotatingCard style={{height:220}}>
          <GlassCard>
            <Text style={styles.sectionTitle}>Floating Cards</Text>
          </GlassCard>
        </RotatingCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20 },
  greeting: { color: COLORS.text, fontSize: 22, marginVertical: 8 },
  aiCard: { marginBottom: 18 },
  aiTitle: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
  aiText: { color: 'rgba(248,250,252,0.8)', marginTop: 8 },
  small: { color: 'rgba(248,250,252,0.6)' },
  rate: { color: COLORS.primary, fontSize: 20, marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  button: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  buttonText: { color: '#04101A', fontWeight: '700' },
  sectionTitle: { color: COLORS.text, fontSize: 16 }
});
