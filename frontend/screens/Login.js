import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import GlassCard from '../components/GlassCard';
import { COLORS } from '../theme';
import * as AuthStorage from '../lib/AuthStorage';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    setLoading(true);
    try {
      // Mock login: call backend if available or just store a dummy token
      // const res = await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
      // const json = await res.json();
      const json = { success: true, data: { token: 'mock-token-123' } };
      if (json && json.success && json.data?.token) {
        await AuthStorage.saveToken(json.data.token);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login failed');
      }
    } catch (e) {
      Alert.alert('Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <TextInput placeholder="Email" placeholderTextColor="rgba(248,250,252,0.5)" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextInput placeholder="Password" placeholderTextColor="rgba(248,250,252,0.5)" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.button} onPress={doLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  card: { width: '90%', padding: 20, alignItems: 'stretch' },
  title: { color: COLORS.text, fontSize: 22, marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 0, color: COLORS.text, padding: 12, marginVertical: 8, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10 },
  button: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, marginTop: 12, alignItems: 'center' },
  buttonText: { color: '#04101A', fontWeight: '700' }
});
