import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

let permissionGranted = false;

export async function initNotifications(): Promise<void> {
  const granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  } else {
    permissionGranted = true;
  }
}

export function notify(title: string, body: string): void {
  if (permissionGranted) {
    sendNotification({ title, body });
  }
}
