import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { reportToCsv, type BuiltReport } from './buildReport';

export async function downloadReportCsv(report: BuiltReport): Promise<void> {
  const csv = reportToCsv(report);
  const safeTitle = report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fileName = `gcashflow-${safeTitle}-${Date.now()}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: `Download ${report.title} report`,
    UTI: 'public.comma-separated-values-text',
  });
}
