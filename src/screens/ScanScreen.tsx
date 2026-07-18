import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { SAMPLE_CASH_IN_PARSED } from '../ocr/sampleCashIn';
import { parseGCashReceipt } from '../ocr/parseGCashReceipt';
import { recognizeTextFromImage } from '../ocr/recognizeText';
import { SAMPLE_EXPRESS_SEND_PARSED } from '../ocr/sampleExpressSend';
import { colors, radii, spacing } from '../theme';
import type { ParsedReceipt, TransactionSource, TransactionType } from '../types';

export interface ScanResult {
  imageUri: string;
  parsed: ParsedReceipt;
  source: TransactionSource;
}

interface Props {
  scanType: TransactionType;
  onCancel: () => void;
  onParsed: (result: ScanResult) => void;
}

export function ScanScreen({ scanType, onCancel, onParsed }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'choose' | 'camera'>('choose');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isCashIn = scanType === 'cash_in';
  const [status, setStatus] = useState(
    isCashIn ? 'Ready to read a GCash Cash In receipt.' : 'Ready to read a GCash Cash Out receipt.',
  );
  const [error, setError] = useState<string | null>(null);

  const runOcr = async (uri: string, source: TransactionSource, base64?: string) => {
    setBusy(true);
    setError(null);
    setPreviewUri(uri);
    setStatus('Reading text from the image…');

    try {
      const text = await recognizeTextFromImage(uri, base64);
      const parsed = parseGCashReceipt(text);
      // Force scanner mode type so cash-in / cash-out stay separate.
      const forced: ParsedReceipt = { ...parsed, type: scanType };
      setStatus(
        forced.amount
          ? `Found ${isCashIn ? 'cash in' : 'cash out'} ₱${forced.amount.toFixed(2)} — review next.`
          : 'Text found. Confirm the details on the next screen.',
      );
      onParsed({ imageUri: uri, parsed: forced, source });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not read this image.';
      setError(
        message.toLowerCase().includes('worker')
          ? 'OCR engine failed on this device. Try again with internet, or use the sample receipt.'
          : message,
      );
      setStatus('OCR failed. Try again, use the sample, or enter details manually.');
    } finally {
      setBusy(false);
    }
  };

  const useSampleReceipt = () => {
    setBusy(true);
    setError(null);
    setPreviewUri(null);
    if (isCashIn) {
      setStatus('Loaded Cash In sample (₱1,000.00).');
      onParsed({
        imageUri: '',
        parsed: SAMPLE_CASH_IN_PARSED,
        source: 'upload',
      });
    } else {
      setStatus('Loaded Express Send / Cash Out sample (₱200.00).');
      onParsed({
        imageUri: '',
        parsed: SAMPLE_EXPRESS_SEND_PARSED,
        source: 'upload',
      });
    }
    setBusy(false);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await runOcr(result.assets[0].uri, 'upload', result.assets[0].base64 ?? undefined);
    }
  };

  const openDeviceCameraPicker = async () => {
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      setError('Camera permission is required to capture receipts.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await runOcr(result.assets[0].uri, 'camera', result.assets[0].base64 ?? undefined);
    }
  };

  const captureWithLiveCamera = async () => {
    if (!cameraRef.current || busy) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
        base64: true,
      });
      if (photo?.uri) {
        await runOcr(photo.uri, 'camera', photo.base64 ?? undefined);
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
              label="Back"
              onPress={() => setMode('choose')}
              variant="ghost"
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
      <ScrollView contentContainerStyle={styles.panel} keyboardShouldPersistTaps="handled">
        <Pressable onPress={onCancel} hitSlop={10} disabled={busy}>
          <Text style={styles.backLink}>← Back</Text>
        </Pressable>
        <Text style={styles.brand}>{isCashIn ? 'Cash In scanner' : 'Cash Out scanner'}</Text>
        <Text style={styles.title}>
          {isCashIn ? 'Scan Cash In receipt' : 'Scan Cash Out receipt'}
        </Text>
        <Text style={styles.body}>
          {isCashIn
            ? 'Upload or photograph a GCash Cash In success screen. Needs internet for OCR.'
            : 'Upload or photograph a GCash Cash Out / Express Send success screen. Needs internet for OCR.'}
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
          label="Upload from gallery"
          onPress={pickFromGallery}
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
          variant="secondary"
          style={styles.gap}
          disabled={busy}
        />
        <PrimaryButton
          label={isCashIn ? 'Use sample Cash In (₱1,000)' : 'Use sample Cash Out (₱200)'}
          onPress={useSampleReceipt}
          variant="secondary"
          style={styles.gap}
          disabled={busy}
        />
      </ScrollView>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backLink: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ocean,
    marginBottom: spacing.md,
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
