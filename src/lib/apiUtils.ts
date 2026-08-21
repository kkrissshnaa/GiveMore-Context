import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves an API path to a fully qualified URL on native platforms,
 * or keeps it relative on web.
 */
export function resolveApiUrl(path: string): string {
  if (Platform.OS === 'web') {
    return path;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  const origin = hostUri
    ? `http://${hostUri.split(':')[0]}:8081`
    : 'http://127.0.0.1:8081';

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}
