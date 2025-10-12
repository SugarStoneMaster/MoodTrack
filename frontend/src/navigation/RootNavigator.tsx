import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import EntriesScreen from '../screens/EntriesScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ChartScreen from '../screens/ChartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EntryDetailScreen from '../screens/EntryDetailScreen';
import NewEntryScreen from '../screens/NewEntryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Entries"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.line,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Entries: focused ? 'list' : 'list-outline',
            Calendar: focused ? 'calendar' : 'calendar-outline',
            Chart: focused ? 'stats-chart' : 'stats-chart-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Entries" component={EntriesScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Chart" component={ChartScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthedStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.primary,       // 👈 colore freccia back + testo
        headerTitleStyle: { color: theme.text }, // 👈 colore titolo
      }}
    >
      <Stack.Screen name="Entries" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="EntryDetail" component={EntryDetailScreen} options={{ title: 'Entry' }} />
      <Stack.Screen name="NewEntry" component={NewEntryScreen} options={{ title: 'New Entry' }} />
    </Stack.Navigator>
  );
}

function UnauthedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthed } = useAuth();
  return (
    <NavigationContainer theme={DarkTheme}>
      {isAuthed ? <AuthedStack /> : <UnauthedStack />}
    </NavigationContainer>
  );
}