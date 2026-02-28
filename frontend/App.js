import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './screens/SplashScreen';
import Dashboard from './screens/Dashboard';
import GiftCard from './screens/GiftCard';
import Wallet from './screens/Wallet';
import Login from './screens/Login';
import { ThemeProvider } from './theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="GiftCard" component={GiftCard} />
          <Stack.Screen name="Wallet" component={Wallet} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
