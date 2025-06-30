import { Platform, Share as RNShare } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export async function shareLink(url: string) {
  try {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await Clipboard.setStringAsync(url);
        alert('Link copied to clipboard');
      }
    } else {
      await RNShare.share({ message: url, url });
    }
  } catch (e) {
    console.warn('Share failed', e);
  }
}
