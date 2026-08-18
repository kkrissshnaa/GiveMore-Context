import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

/**
 * Resolves a local file URI from a remote HTTP URL, base64 data URL, or local file path.
 */
export async function getLocalImageUri(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;

  // If already a local file:// path, return it directly
  if (imageUrl.startsWith('file://')) {
    return imageUrl;
  }

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
 * Downloads image and saves it to the device photo gallery/library.
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

    // Request permissions for MediaLibrary
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        message: 'Permission to access media gallery was denied. Please enable it in Settings.',
      };
    }

    const localUri = await getLocalImageUri(imageUrl);
    if (!localUri) {
      return { success: false, message: 'Failed to prepare image file for saving.' };
    }

    const asset = await MediaLibrary.createAssetAsync(localUri);
    if (asset) {
      return { success: true, message: 'Image saved to your Photo Library!' };
    } else {
      return { success: false, message: 'Could not create image asset in library.' };
    }
  } catch (err: any) {
    console.error('Error downloading/saving image:', err);
    return { success: false, message: err?.message || 'Failed to save image to gallery.' };
  }
}

/**
 * Shares image directly to external apps (WhatsApp, Instagram, Telegram, Mail, etc.).
 */
export async function shareImageToApps(imageUrl: string, promptText?: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (Platform.OS === 'web') {
      if (navigator.share) {
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

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(localUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Generated Image',
        UTI: 'public.png',
      });
      return { success: true };
    } else {
      // Fallback to React Native Share API
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
