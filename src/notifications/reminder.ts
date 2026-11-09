import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Open question in the spec: reminders stay neutral for now and don't mention the cloud's mood. */
export const REMINDER_BODY = 'A quiet moment to write?';

/**
 * Schedules the one daily reminder, replacing any earlier one.
 * Returns the notification id, or null if the person declined permission.
 */
export async function scheduleDailyReminder(hour: number, minute: number, cloudName: string): Promise<string | null> {
  const perms = await Notifications.getPermissionsAsync();
  let granted = perms.granted;
  if (!granted && perms.canAskAgain) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily reminder',
      // The enum is re-exported from a .types module that eslint-plugin-import can't follow; tsc confirms it exists.
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Cloud Journal', body: `${REMINDER_BODY} ${cloudName} is around.` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
