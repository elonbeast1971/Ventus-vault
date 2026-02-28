import * as LocalAuthentication from 'expo-local-authentication';
import React from 'react';

export async function isBiometricAvailable() {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return types && types.length > 0;
}

export async function authenticate() {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate',
      cancelLabel: 'Cancel',
    });
    return result.success;
  } catch (err) {
    return false;
  }
}

export default function BiometricAuth() {
  return null;
}
