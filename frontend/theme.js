import React from 'react';
import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#0A0F1C',
  primary: '#14F5B8',
  secondary: '#67E8F9',
  text: '#F8FAFC',
  glassTint: 'rgba(255,255,255,0.07)'
};

export function ThemeProvider({ children }) {
  return children;
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  }
});
