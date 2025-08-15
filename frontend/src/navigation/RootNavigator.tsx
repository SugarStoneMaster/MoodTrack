import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme, Button } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import EntriesScreen from '../screens/EntriesScreen';
import NewEntryScreen from '../screens/NewEntryScreen';
import ChartScreen from '../screens/ChartScreen';
import ChatScreen from '../screens/ChatScreen';
import { useAuth } from '../auth/AuthContext';

const Stack = createNativeStackNavigator();

function AuthedStack() {
  const { logout } = useAuth();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Entries"
        component={EntriesScreen}
        options={({ navigation }) => ({
          title: 'MoodTrack',
          headerLargeTitle: true, // iOS style
          headerRight: () => (
            <>
              <Button title="Add" onPress={() => navigation.navigate('NewEntry')} />
              <Button title="Chart" onPress={() => navigation.navigate('Chart')} />
              <Button title="Chat" onPress={() => navigation.navigate('Chat')} />
              <Button title="Logout" onPress={logout} />
            </>
          ),
        })}
      />
      <Stack.Screen name="NewEntry" component={NewEntryScreen} options={{ title: 'Nuova Voce' }} />
      <Stack.Screen name="Chart" component={ChartScreen} options={{ title: 'Andamento' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Confidente' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const scheme = useColorScheme();
  const { isAuthed } = useAuth();
  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthed ? <Stack.Screen name="App" component={AuthedStack} /> : <Stack.Screen name="Login" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}