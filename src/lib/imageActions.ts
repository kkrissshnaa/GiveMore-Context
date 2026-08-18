import { Platform, Share } from 'react-native';

// Safe dynamic getters for Expo native modules to prevent top-level evaluation crashes
// when running on platforms or Expo Go binaries where native modules are missing.

async function getFileSystem() {
  try {
    return await import('expo-file-system/legacy');
  } catch (err) {
    console.warn('FileSystem module failed to load:', err);
    return null;
  }
}

async function getSharing() {
  try {
    return await import('expo-sharing');
  } catch (err) {
    console.warn('Sharing module failed to load:', err);
    return null;
  }
}

async function getMediaLibrary() {
  try {
    const ml = await import('expo-media-library');
    if (ml && typeof ml.requestPermissionsAsync === 'function') {
      return ml;
    }
    return null;
  } catch (err) {
    console.warn('MediaLibrary module not available on this build:', err);
    return null;
  }
}

/**
 * Resolves a local file URI from a remote HTTP URL, base64 data URL, or local file path.
 */
export async function getLocalImageUri(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('file://')) {
    return imageUrl;
  }

  const FileSystem = await getFileSystem();
  if (!FileSystem) return imageUrl;

  const filename = `givemore_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  const targetUri = `${baseDir}${filename}`;

  try {
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1] || imageUrl;
      await FileSystem.writeAsStringAsync(targetUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return targetUri;
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const result = await FileSystem.downloadAsync(imageUrl, targetUri);
      return result.uri;
    }
  } catch (err) {
    console.error('Error resolving local image URI:', err);
  }

  return imageUrl;
}

/**
 * Downloads image and saves it to the device photo gallery/library, or falls back gracefully to system Share.
 */
export async function downloadAndSaveImage(imageUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `givemore_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, message: 'Image downloaded successfully' };
      }
      return { success: false, message: 'Web download not supported in this environment' };
    }

    const localUri = await getLocalImageUri(imageUrl);
    if (!localUri) {
      return { success: false, message: 'Could not prepare image file for saving.' };
    }

    // Attempt MediaLibrary saving with full inner try-catch guard
    let mediaLibrarySaved = false;
    try {
      const MediaLibrary = await getMediaLibrary();
      if (MediaLibrary && typeof MediaLibrary.requestPermissionsAsync === 'function') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(localUri);
          if (asset) {
            mediaLibrarySaved = true;
            return { success: true, message: 'Image saved to Photo Library!' };
          }
        }
      }
    } catch (e: any) {
      console.warn('MediaLibrary native module unavailable (Expo Go/Client fallback active):', e?.message);
    }

    // Fallback: Use system Share / Save dialog so user can save directly to Photos/Downloads
    if (!mediaLibrarySaved) {
      const Sharing = await getSharing();
      if (Sharing && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'image/png',
          dialogTitle: 'Save Image to Downloads / Photos',
          UTI: 'public.png',
        });
        return { success: true, message: 'Opened Save / Share options.' };
      } else {
        await Share.share({
          title: 'GiveMore Image',
          url: localUri,
        });
        return { success: true, message: 'Opened Save options.' };
      }
    }

    return { success: false, message: 'Could not save image file.' };
  } catch (err: any) {
    console.error('Error downloading/saving image:', err);
    return { success: false, message: err?.message || 'Failed to save image.' };
  }
}

/**
 * Shares image directly to external apps (WhatsApp, Instagram, Telegram, Mail, etc.).
 */
export async function shareImageToApps(imageUrl: string, promptText?: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'GiveMore AI Generation',
          text: promptText || 'Check out this AI image generated with GiveMore!',
          url: imageUrl,
        });
        return { success: true };
      } else {
        return { success: false, message: 'Web Sharing not supported on this browser.' };
      }
    }

    const localUri = await getLocalImageUri(imageUrl);
    if (!localUri) {
      return { success: false, message: 'Could not process image for sharing.' };
    }

    const Sharing = await getSharing();
    if (Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(localUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Generated Image',
        UTI: 'public.png',
      });
      return { success: true };
    } else {
      await Share.share({
        title: 'GiveMore Generation',
        message: promptText ? `"${promptText}" — Generated with GiveMore AI` : 'Generated with GiveMore AI',
        url: localUri,
      });
      return { success: true };
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('Error sharing image:', err);
    }
    return { success: false, message: err?.message || 'Sharing cancelled or failed.' };
  }
}
