import React from 'react';
import 'react-native-gesture-handler';
import { AuthProvider } from './src/auth/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}