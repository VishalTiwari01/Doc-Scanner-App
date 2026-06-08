import { pick, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';
import { store } from '../redux/store';

const API_BASE_URL = 'https://docmaster-backend.onrender.com/api/v1';

export class FileService {
  /**
   * Request write storage permissions (Android-specific)
   */
  static async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    // Android 13+ (API 33+) does not need explicit WRITE_EXTERNAL_STORAGE
    if (Number(Platform.Version) >= 33) return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'DocMaster AI needs access to save files to your device storage.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Storage permission error:', err);
      return false;
    }
  }

  /**
   * Pick a single PDF file from device storage
   */
  static async pickPDF(): Promise<{ name: string; size: number; uri: string; type?: string } | null> {
    try {
      const results = await pick({
        type: ['application/pdf'],
        allowMultiSelection: false,
      });
      const file = results[0];
      if (!file) return null;
      return {
        name: file.name || 'document.pdf',
        size: file.size || 0,
        uri: file.uri,
        type: file.type || 'application/pdf',
      };
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        console.log('User cancelled document picking');
      } else {
        console.error('Error picking document:', err);
      }
      return null;
    }
  }

  /**
   * Share a local file path or remote URL
   */
  static async shareFile(fileUri: string, mimeType = 'application/pdf', title = 'Share PDF') {
    try {
      const options = {
        title,
        url: fileUri,
        type: mimeType,
        failOnCancel: false,
      };
      await Share.open(options);
    } catch (err) {
      console.error('Error sharing file:', err);
    }
  }

  /**
   * Builds the proxy download URL for a given file URL.
   *
   * All file downloads — whether from Cloudinary or local /uploads — are
   * routed through our own backend proxy endpoint:
   *   GET /api/v1/pdf/download?url=<encoded_file_url>
   *
   * This means:
   * 1. The JWT token is sent to OUR backend (not to Cloudinary CDN).
   * 2. Cloudinary URLs never receive our JWT, so no 401 from CDN.
   * 3. The backend fetches the file and streams it to the device.
   */
  private static buildProxyDownloadUrl(originalUrl: string): string {
    // Encode the file URL as a query parameter for the proxy endpoint
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${API_BASE_URL}/pdf/download?url=${encodedUrl}`;
  }

  /**
   * Download a remote PDF file and save it to the device's public folder.
   *
   * Uses the backend proxy download endpoint so that:
   * - JWT token goes to our backend, not external CDNs
   * - Cloudinary / S3 files download cleanly without 401 errors
   */
  static async saveFileToDevice(
    fileUrl: string,
    fileName: string,
    onProgress?: (received: number, total: number) => void
  ): Promise<string> {
    const hasPermission = await this.requestStoragePermission();
    if (!hasPermission) {
      throw new Error('Storage write permission denied');
    }

    // Route through our authenticated proxy endpoint
    const proxyUrl = FileService.buildProxyDownloadUrl(fileUrl);
    console.log('[FileService] Proxy URL:', proxyUrl);

    // Determine target path
    let destPath = '';
    if (Platform.OS === 'ios') {
      destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    } else {
      destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    }

    // Handle existing file — suffix with unique counter
    let finalPath = destPath;
    let fileExists = await RNFS.exists(finalPath);
    let counter = 1;

    const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.pdf';
    const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;

    while (fileExists) {
      if (Platform.OS === 'ios') {
        finalPath = `${RNFS.DocumentDirectoryPath}/${baseName}_(${counter})${extension}`;
      } else {
        finalPath = `${RNFS.DownloadDirectoryPath}/${baseName}_(${counter})${extension}`;
      }
      fileExists = await RNFS.exists(finalPath);
      counter++;
    }

    // Send JWT only to our own backend proxy — never to Cloudinary/CDNs
    const headers: Record<string, string> = {};
    const accessToken = store.getState().auth.accessToken;
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const downloadResult = RNFS.downloadFile({
        fromUrl: proxyUrl,
        toFile: finalPath,
        headers,
        progress: (res) => {
          if (onProgress) {
            onProgress(res.bytesWritten, res.contentLength);
          }
        },
      });

      const response = await downloadResult.promise;
      console.log('[FileService] Download status:', response.statusCode);

      if (response.statusCode === 200) {
        return finalPath;
      } else {
        throw new Error(`Download failed with status code: ${response.statusCode}`);
      }
    } catch (err: any) {
      console.error('[FileService] Download error:', err);
      throw new Error(`Download error: ${err.message}`);
    }
  }
}
