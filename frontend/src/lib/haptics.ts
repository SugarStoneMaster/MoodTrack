import * as Haptics from 'expo-haptics';

export function tapLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function notifySuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function notifyWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}