import { Platform } from 'react-native';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';
/** Free demo key from OCR.space docs — works for testing; rate-limited. */
const OCR_SPACE_API_KEY = 'helloworld';

function guessMime(uri: string): { mime: string; filetype: string } {
  const lower = uri.toLowerCase();
  if (lower.includes('.png') || lower.startsWith('data:image/png')) {
    return { mime: 'image/png', filetype: 'PNG' };
  }
  if (lower.includes('.webp') || lower.startsWith('data:image/webp')) {
    return { mime: 'image/webp', filetype: 'PNG' };
  }
  return { mime: 'image/jpeg', filetype: 'JPG' };
}

async function uriToDataUri(imageUri: string, base64Hint?: string): Promise<{ dataUri: string; filetype: string }> {
  if (imageUri.startsWith('data:image/')) {
    const { filetype } = guessMime(imageUri);
    return { dataUri: imageUri, filetype };
  }

  const { mime, filetype } = guessMime(imageUri);

  if (base64Hint) {
    return { dataUri: `data:${mime};base64,${base64Hint}`, filetype };
  }

  // content:// and file:// — read as base64 on native
  if (Platform.OS !== 'web') {
    const base64 = await readAsStringAsync(imageUri, { encoding: EncodingType.Base64 });
    return { dataUri: `data:${mime};base64,${base64}`, filetype };
  }

  // Web: fetch blob → base64
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read image for OCR.'));
    reader.readAsDataURL(blob);
  });
  return { dataUri, filetype };
}

async function recognizeWithOcrSpace(dataUri: string, filetype: string): Promise<string> {
  const form = new FormData();
  form.append('base64Image', dataUri);
  form.append('language', 'eng');
  form.append('isOverlayRequired', 'false');
  form.append('OCREngine', '2');
  form.append('scale', 'true');
  form.append('detectOrientation', 'true');
  form.append('filetype', filetype);

  const response = await fetch(OCR_SPACE_URL, {
    method: 'POST',
    headers: {
      apikey: OCR_SPACE_API_KEY,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`OCR service error (${response.status}). Check your internet connection.`);
  }

  const json = (await response.json()) as {
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string | string[];
    ParsedResults?: Array<{ ParsedText?: string }>;
  };

  if (json.IsErroredOnProcessing) {
    const msg = Array.isArray(json.ErrorMessage)
      ? json.ErrorMessage.join(' ')
      : json.ErrorMessage || 'OCR failed';
    throw new Error(msg);
  }

  const text = json.ParsedResults?.map((r) => r.ParsedText ?? '').join('\n').trim() ?? '';
  return text;
}

export async function recognizeTextFromImage(
  imageUri: string,
  base64Hint?: string,
): Promise<string> {
  const { dataUri, filetype } = await uriToDataUri(imageUri, base64Hint);
  const text = await recognizeWithOcrSpace(dataUri, filetype);
  if (!text.trim()) {
    throw new Error('No text found. Try a clearer photo of the full GCash receipt.');
  }
  return text;
}

export async function terminateOcrWorker(): Promise<void> {
  // Network OCR — nothing to terminate
}
