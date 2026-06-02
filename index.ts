import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Suppress the harmless SDK 53/54 Expo Go push notifications warning on Android.
// This warning triggers on import because Expo Go doesn't support remote notifications anymore,
// but we only use local scheduled reminders.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'remote notifications'
]);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
