import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { parseGCashReceipt } from '../ocr/parseGCashReceipt';
import { recognizeTextFromImage } from '../ocr/recognizeText';
import { colors, radii, spacing } from '../theme';
import type { ParsedReceipt, TransactionSource } from '../types';

export interface ScanResult {
  imageUri: string;
  parsed: ParsedReceipt;
  source: TransactionSource;
}

interface Props {
  onCancel: () => void;
  onParsed: (result: ScanResult) => void;
}

export function ScanScreen({ onCancel, onParsed }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'choose' | 'camera'>('choose');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready to read a GCash receipt.');
  const [error, setError] = useState<string | null>(null);

  const runOcr = async (uri: string, source: TransactionSource) => {
    setBusy(true);
    setError(null);
    setPreviewUri(uri);
    setStatus('Reading text from the image…');

    try {
      const text = await recognizeTextFromImage(uri);
      if (!text.trim()) {
        throw new Error('No text found. Try a clearer photo of the receipt.');
      }

      const parsed = parseGCashReceipt(text);
      setStatus(
        parsed.amount
          ? `Found ${parsed.type === 'cash_out' ? 'cash out' : parsed.type === 'cash_in' ? 'cash in' : 'amount'} — review next.`
          : 'Text found. Confirm the details on the next screen.',
      );
      onParsed({ imageUri: uri, parsed, source });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not read this image.';
      setError(message);
      setStatus('OCR failed. Try again or enter details manually.');
    } finally {
      setBusy(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await runOcr(result.assets[0].uri, 'upload');
    }
  };

  const openDeviceCameraPicker = async () => {
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      setError('Camera permission is required to capture receipts.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await runOcr(result.assets[0].uri, 'camera');
    }
  };

  const captureWithLiveCamera = async () => {
    if (!cameraRef.current || busy) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) {
        await runOcr(photo.uri, 'camera');
      }
    } catch {
      setError('Could not capture photo. Try the quick camera option instead.');
    }
  };

  if (mode === 'camera') {
    if (!permission) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.ocean} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.panel}>
            <Text style={styles.title}>Camera access needed</Text>
            <Text style={styles.body}>
              Allow the camera so you can photograph GCash cash in and cash out receipts.
            </Text>
            <PrimaryButton label="Allow camera" onPress={requestPermission} />
            <PrimaryButton label="Use gallery instead" onPress={pickFromGallery} variant="secondary" style={styles.gap} />
            <PrimaryButton label="Back" onPress={() => setMode('choose')} variant="ghost" style={styles.gap} />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.cameraRoot}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <SafeAreaView style={styles.cameraUi} edges={['top', 'bottom']}>
          <Text style={styles.cameraHint}>Frame the full GCash receipt</Text>
          <View style={styles.frame} />
          {busy ? (
            <View style={styles.busyBanner}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.busyText}>{status}</Text>
            </View>
          ) : null}
          <View style={styles.cameraActions}>
            <PrimaryButton label="Capture" onPress={captureWithLiveCamera} disabled={busy} />
            <PrimaryButton
              label="Cancel"
              onPress={() => setMode('choose')}
              variant="secondary"
              style={styles.gap}
              disabled={busy}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.panel}>
        <Text style={styles.brand}>Scan</Text>
        <Text style={styles.title}>Read cash in / cash out</Text>
        <Text style={styles.body}>
          Use the camera or upload a screenshot. We extract amount, fee, reference, and type from the receipt text.
        </Text>

        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Receipt preview appears here</Text>
          </View>
        )}

        <Text style={styles.status}>{status}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Open live camera"
          onPress={async () => {
            if (!permission?.granted) {
              const res = await requestPermission();
              if (!res.granted) {
                await openDeviceCameraPicker();
                return;
              }
            }
            setMode('camera');
          }}
          loading={busy}
          disabled={busy}
        />
        <PrimaryButton
          label="Quick camera shot"
          onPress={openDeviceCameraPicker}
          variant="secondary"
          style={styles.gap}
          disabled={busy}
        />
        <PrimaryButton
          label="Upload from gallery"
          onPress={pickFromGallery}
          variant="secondary"
          style={styles.gap}
          disabled={busy}
        />
        <PrimaryButton label="Back" onPress={onCancel} variant="ghost" style={styles.gap} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  panel: {
    flex: 1,
    padding: spacing.lg,
  },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    color: colors.ocean,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 30,
    color: colors.ink,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    backgroundColor: colors.mist,
    marginBottom: spacing.md,
  },
  placeholder: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  placeholderText: {
    fontFamily: 'DMSans_500Medium',
    color: colors.inkSoft,
  },
  status: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  error: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.cashOut,
    marginBottom: spacing.md,
  },
  gap: {
    marginTop: spacing.sm,
  },
  cameraRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraUi: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  cameraHint: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  frame: {
    alignSelf: 'center',
    width: '86%',
    height: '52%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.md,
  },
  busyBanner: {
    position: 'absolute',
    top: '46%',
    alignSelf: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  busyText: {
    fontFamily: 'DMSans_500Medium',
    color: colors.white,
  },
  cameraActions: {
    marginBottom: spacing.md,
  },
});
