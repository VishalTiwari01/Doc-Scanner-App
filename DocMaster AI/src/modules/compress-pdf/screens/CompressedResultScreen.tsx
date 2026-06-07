import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Snackbar, Portal, Dialog, Button, Divider } from 'react-native-paper';
import { useAppSelector, useAppDispatch } from '../../../redux/store';
import { clearPdfState } from '../../../redux/slices/pdfSlice';
import { FileService } from '../../../services/fileService';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';

export const CompressedResultScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { compressedResult } = useAppSelector((state) => state.pdf);
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!compressedResult) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall">No compression result found</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Dashboard')} style={styles.doneBtn}>
          Back to Home
        </Button>
      </View>
    );
  }

  // Helper to extract numeric values for size percentage calculation
  const parseSizeToBytes = (sizeStr: string): number => {
    const value = parseFloat(sizeStr);
    if (sizeStr.includes('GB')) return value * 1024 * 1024 * 1024;
    if (sizeStr.includes('MB')) return value * 1024 * 1024;
    if (sizeStr.includes('KB')) return value * 1024;
    return value;
  };

  const origBytes = parseSizeToBytes(compressedResult.originalSize);
  const compBytes = parseSizeToBytes(compressedResult.compressedSize);
  
  // Calculate percentage reduction
  const reductionPercent = Math.max(0, Math.round(((origBytes - compBytes) / origBytes) * 100));

  const handleShare = async () => {
    await FileService.shareFile(
      compressedResult.downloadUrl,
      'application/pdf',
      `Share ${compressedResult.fileName}`
    );
  };

  const handleSaveToDevice = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const savedPath = await FileService.saveFileToDevice(
        compressedResult.downloadUrl,
        `DocMaster_${compressedResult.fileName}`
      );
      setSuccessMsg(`File successfully saved to: ${savedPath}`);
    } catch (err: any) {
      console.log('Error saving file:', err);
      setErrorMsg(err.message || 'Failed to save file to storage');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    dispatch(clearPdfState());
    navigation.navigate('Dashboard');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Banner */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Compression Complete!</Text>
          <Text variant="titleMedium" style={styles.reductionText}>
            Your file is now <Text style={styles.percentText}>{reductionPercent}% smaller</Text>!
          </Text>
        </View>

        {/* Visual Graph Card */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>File Size Comparison</Text>
            
            {/* Original Bar */}
            <View style={styles.barContainer}>
              <View style={styles.barLabelRow}>
                <Text variant="bodyLarge" style={styles.barLabel}>Original File</Text>
                <Text variant="bodyLarge" style={styles.barSizeText}>{compressedResult.originalSize}</Text>
              </View>
              <View style={styles.backgroundBar}>
                <View style={[styles.filledBar, styles.originalBar]} />
              </View>
            </View>

            {/* Compressed Bar */}
            <View style={styles.barContainer}>
              <View style={styles.barLabelRow}>
                <Text variant="bodyLarge" style={styles.barLabel}>Compressed File</Text>
                <Text variant="bodyLarge" style={[styles.barSizeText, styles.compressedText]}>{compressedResult.compressedSize}</Text>
              </View>
              <View style={styles.backgroundBar}>
                <View 
                  style={[
                    styles.filledBar, 
                    styles.compressedBar, 
                    { width: `${Math.max(15, 100 - reductionPercent)}%` }
                  ]} 
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Details List */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <View style={styles.detailRow}>
              <Text variant="bodyLarge" style={styles.detailLabel}>File Name</Text>
              <Text variant="bodyLarge" style={styles.detailValue} numberOfLines={1}>{compressedResult.fileName}</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text variant="bodyLarge" style={styles.detailLabel}>Original Size</Text>
              <Text variant="bodyLarge" style={styles.detailValue}>{compressedResult.originalSize}</Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="bodyLarge" style={styles.detailLabel}>Compressed Size</Text>
              <Text variant="bodyLarge" style={[styles.detailValue, styles.compressedText]}>{compressedResult.compressedSize}</Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="bodyLarge" style={styles.detailLabel}>Total Savings</Text>
              <Text variant="bodyLarge" style={[styles.detailValue, styles.savingsValue]}>
                {reductionPercent}% Reduction
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <CustomButton
            title="Save to Device"
            onPress={handleSaveToDevice}
            icon="download"
            style={styles.btn}
          />
          <CustomButton
            title="Share PDF"
            onPress={handleShare}
            mode="outlined"
            icon="share-variant"
            style={styles.btn}
          />
          <CustomButton
            title="Done"
            onPress={handleDone}
            mode="text"
            style={styles.doneBtn}
          />
        </View>
      </ScrollView>

      {/* Save indicator dialog */}
      <Portal>
        <Dialog visible={isSaving} dismissable={false}>
          <Dialog.Title>Saving File</Dialog.Title>
          <Dialog.Content>
            <Text>Downloading and storing the optimized PDF to your storage folder...</Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Notifications */}
      <Snackbar
        visible={!!successMsg}
        onDismiss={() => setSuccessMsg(null)}
        duration={5000}
        style={styles.successSnackbar}
        action={{
          label: 'OK',
          onPress: () => setSuccessMsg(null),
        }}
      >
        {successMsg}
      </Snackbar>

      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg(null)}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {errorMsg}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  reductionText: {
    color: theme.colors.placeholder,
    marginTop: 8,
    textAlign: 'center',
  },
  percentText: {
    color: 'green',
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  chartTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  barContainer: {
    marginBottom: 16,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  barSizeText: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  backgroundBar: {
    height: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  filledBar: {
    height: '100%',
    borderRadius: 8,
  },
  originalBar: {
    width: '100%',
    backgroundColor: '#94A3B8', // Slate grey
  },
  compressedBar: {
    backgroundColor: 'green', // Green saving bar
  },
  compressedText: {
    color: 'green',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    color: theme.colors.placeholder,
  },
  detailValue: {
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  savingsValue: {
    color: 'green',
    fontWeight: 'bold',
  },
  divider: {
    backgroundColor: '#F1F5F9',
  },
  actionButtons: {
    marginBottom: 20,
  },
  btn: {
    marginBottom: 12,
  },
  doneBtn: {
    marginTop: 8,
  },
  successSnackbar: {
    backgroundColor: 'green',
  },
  errorSnackbar: {
    backgroundColor: theme.colors.error,
  },
});
