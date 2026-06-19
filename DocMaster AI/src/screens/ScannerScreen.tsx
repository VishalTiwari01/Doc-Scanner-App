import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, Clipboard, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Text, Card, IconButton, Portal, Dialog, Button, RadioButton, Divider } from 'react-native-paper';
import { launchCamera, Asset } from 'react-native-image-picker';
import { FileService } from '../services/fileService';
import { useImageToPDFMutation } from '../modules/image-to-pdf/services/imageToPdfApi';
import { useProcessOCRMutation } from '../modules/ocr/services/ocrApi';
import { useCompressImageMutation } from '../modules/image-compress/services/imageCompressApi';
import { CustomButton } from '../components/CustomButton';
import { theme } from '../styles/theme';

export const ScannerScreen = () => {
  const [scannedImage, setScannedImage] = useState<Asset | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'ocr' | 'compress' | null>(null);
  
  // Format configurations
  const [ocrType, setOcrType] = useState<'generic' | 'aadhaar' | 'pan' | 'passport'>('generic');
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Mutations
  const [imageToPDF, { isLoading: isConvertingPdf }] = useImageToPDFMutation();
  const [processOCR, { isLoading: isRunningOcr }] = useProcessOCRMutation();
  const [compressImage, { isLoading: isCompressingImage }] = useCompressImageMutation();

  const isProcessing = isConvertingPdf || isRunningOcr || isCompressingImage;

  // Results
  const [result, setResult] = useState<{
    type: 'pdf' | 'ocr' | 'compress';
    fileName: string;
    originalSize: string;
    compressedSize: string;
    downloadUrl?: string;
    historyId: string;
    extractedText?: string;
    structuredData?: Record<string, any>;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getActiveColor = () => {
    if (selectedFormat === 'pdf') return '#4361EE';
    if (selectedFormat === 'ocr') return '#F59E0B';
    if (selectedFormat === 'compress') return '#00B5AD';
    return theme.colors.primary;
  };

  const getSuccessColor = () => {
    if (result) {
      if (result.type === 'pdf') return '#4361EE';
      if (result.type === 'ocr') return '#F59E0B';
      if (result.type === 'compress') return '#00B5AD';
    }
    return theme.colors.primary;
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleScan = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setResult(null);
    setSelectedFormat(null);

    launchCamera(
      {
        mediaType: 'photo',
        saveToPhotos: true,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled camera capture');
        } else if (response.errorCode) {
          setErrorMsg(response.errorMessage || 'Camera capture error');
        } else if (response.assets && response.assets.length > 0) {
          setScannedImage(response.assets[0]);
        }
      }
    );
  };

  const processConversion = async () => {
    if (!scannedImage || !selectedFormat) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    const originalSizeStr = scannedImage.fileSize ? formatBytes(scannedImage.fileSize) : 'Analyzing...';
    const name = scannedImage.fileName || `scan_${Date.now()}.jpg`;
    const type = scannedImage.type || 'image/jpeg';

    if (selectedFormat === 'pdf') {
      formData.append('images', {
        uri: scannedImage.uri,
        name,
        type,
      } as any);

      try {
        const response = await imageToPDF(formData).unwrap();
        if (response && response.success) {
          setResult({
            type: 'pdf',
            fileName: `DocMaster_Scan_${Date.now().toString().slice(-4)}.pdf`,
            originalSize: originalSizeStr,
            compressedSize: response.pdfSize || 'Compiled',
            downloadUrl: response.pdfUrl,
            historyId: response.historyId,
          });
        }
      } catch (err: any) {
        setErrorMsg(err.data?.message || 'Failed to convert scan to PDF');
      }
    } else if (selectedFormat === 'ocr') {
      formData.append('image', {
        uri: scannedImage.uri,
        name,
        type,
      } as any);
      formData.append('documentType', ocrType);

      try {
        const response = await processOCR(formData).unwrap();
        if (response && response.success) {
          setResult({
            type: 'ocr',
            fileName: `${ocrType.toUpperCase()}_Scan_Text.txt`,
            originalSize: `${response.extractedText ? response.extractedText.length : 0} characters`,
            compressedSize: ocrType,
            downloadUrl: response.imageUrl,
            historyId: response.historyId,
            extractedText: response.extractedText,
            structuredData: response.structuredData,
          });
        }
      } catch (err: any) {
        setErrorMsg(err.data?.message || 'Failed to extract text from scan');
      }
    } else if (selectedFormat === 'compress') {
      formData.append('image', {
        uri: scannedImage.uri,
        name,
        type,
      } as any);
      formData.append('compressionLevel', compressionLevel);

      try {
        const response = await compressImage(formData).unwrap();
        if (response && response.success) {
          setResult({
            type: 'compress',
            fileName: response.fileName,
            originalSize: response.originalSize,
            compressedSize: response.compressedSize,
            downloadUrl: response.downloadUrl,
            historyId: response.historyId,
          });
        }
      } catch (err: any) {
        setErrorMsg(err.data?.message || 'Failed to compress scanned image');
      }
    }
  };

  const handleDownload = async () => {
    if (!result || !result.downloadUrl) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const savedPath = await FileService.saveFileToDevice(
        result.downloadUrl,
        `DocMaster_${result.fileName}`
      );
      setSuccessMsg(`Saved to: ${savedPath}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download file');
    }
  };

  const handleShare = async () => {
    if (!result || !result.downloadUrl) return;
    try {
      let mimeType = 'application/pdf';
      if (result.type === 'ocr') mimeType = 'text/plain';
      else if (result.type === 'compress') mimeType = scannedImage?.type || 'image/jpeg';

      await FileService.shareFile(
        result.downloadUrl,
        mimeType,
        `Share ${result.fileName}`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to share file');
    }
  };

  const handleCopyToClipboard = () => {
    if (!result || !result.extractedText) return;
    Clipboard.setString(result.extractedText);
    setSuccessMsg('Copied to clipboard successfully!');
  };

  const getPreviewUrl = () => {
    if (result && result.downloadUrl) {
      if (result.downloadUrl.startsWith('http')) {
        return result.downloadUrl;
      }
      const host = __DEV__
        ? (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')
        : 'https://docmaster-backend.onrender.com';
      return `${host}${result.downloadUrl}`;
    }
    return scannedImage?.uri;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: scan initial screen */}
        {!scannedImage && (
          <View style={styles.emptyContainer}>
            <View style={styles.scannerGraphic}>
              <IconButton icon="camera" iconColor="#4361EE" size={64} style={styles.emptyIcon} />
              <View style={styles.scanBeam} />
            </View>
            <Text variant="headlineSmall" style={styles.pickTitle}>Instant Document Scanner</Text>
            <Text variant="bodyMedium" style={styles.pickSubtitle}>
              Scan receipts, documents, certificates, or ID cards directly using your camera and choose the output format dynamically.
            </Text>
            
            <CustomButton
              title="Scan Document"
              onPress={handleScan}
              icon="camera-outline"
              style={styles.pickBtn}
            />
          </View>
        )}

        {/* Step 2: Captured image & choose format */}
        {scannedImage && !result && (
          <View style={styles.workflowSection}>
            <Card style={styles.imagePreviewCard}>
              <Card.Content style={styles.previewContent}>
                <Image source={{ uri: scannedImage.uri }} style={styles.previewImage} />
                <View style={styles.previewMeta}>
                  <Text variant="bodyLarge" numberOfLines={1} style={styles.previewFileName}>
                    {scannedImage.fileName || 'Scanned Document'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.previewFileSize}>
                    File Size: {scannedImage.fileSize ? formatBytes(scannedImage.fileSize) : 'Analyzing...'}
                  </Text>
                </View>
                <IconButton
                  icon="close-circle"
                  iconColor={theme.colors.error}
                  size={24}
                  onPress={() => setScannedImage(null)}
                />
              </Card.Content>
            </Card>

            <Text variant="titleMedium" style={styles.sectionTitle}>1. Choose Output Format</Text>
            
            <View style={styles.formatRow}>
              {/* Option 1: PDF */}
              <TouchableOpacity
                style={[
                  styles.formatCard,
                  selectedFormat === 'pdf' && { borderColor: '#4361EE', borderWidth: 1.5 }
                ]}
                onPress={() => setSelectedFormat('pdf')}
              >
                <IconButton icon="file-pdf-box" iconColor="#4361EE" size={24} style={styles.formatIcon} />
                <Text style={styles.formatTitle}>PDF Document</Text>
              </TouchableOpacity>

              {/* Option 2: OCR Text */}
              <TouchableOpacity
                style={[
                  styles.formatCard,
                  selectedFormat === 'ocr' && { borderColor: '#F59E0B', borderWidth: 1.5 }
                ]}
                onPress={() => setSelectedFormat('ocr')}
              >
                <IconButton icon="text-recognition" iconColor="#F59E0B" size={24} style={styles.formatIcon} />
                <Text style={styles.formatTitle}>Extract Text</Text>
              </TouchableOpacity>

              {/* Option 3: Compress JPG */}
              <TouchableOpacity
                style={[
                  styles.formatCard,
                  selectedFormat === 'compress' && { borderColor: '#00B5AD', borderWidth: 1.5 }
                ]}
                onPress={() => setSelectedFormat('compress')}
              >
                <IconButton icon="image-filter-vintage" iconColor="#00B5AD" size={24} style={styles.formatIcon} />
                <Text style={styles.formatTitle}>Compress JPG</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Settings fields based on format */}
            {selectedFormat === 'ocr' && (
              <Card style={styles.settingsCard}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.settingsHeader}>OCR Scan Target</Text>
                  <RadioButton.Group onValueChange={value => setOcrType(value as any)} value={ocrType}>
                    <View style={styles.radioRow}>
                      <RadioButton.Item label="Generic" value="generic" style={styles.radioItem} />
                      <RadioButton.Item label="Aadhaar" value="aadhaar" style={styles.radioItem} />
                    </View>
                    <View style={styles.radioRow}>
                      <RadioButton.Item label="PAN Card" value="pan" style={styles.radioItem} />
                      <RadioButton.Item label="Passport" value="passport" style={styles.radioItem} />
                    </View>
                  </RadioButton.Group>
                </Card.Content>
              </Card>
            )}

            {selectedFormat === 'compress' && (
              <Card style={styles.settingsCard}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.settingsHeader}>Compression Quality</Text>
                  <RadioButton.Group onValueChange={value => setCompressionLevel(value as any)} value={compressionLevel}>
                    <View style={styles.verticalRadioGroup}>
                      <RadioButton.Item 
                        label="High (Smallest File)" 
                        value="high" 
                        color="#00B5AD"
                        style={styles.verticalRadioItem} 
                        labelStyle={styles.radioLabelStyle}
                      />
                      <RadioButton.Item 
                        label="Medium (Balanced)" 
                        value="medium" 
                        color="#00B5AD"
                        style={styles.verticalRadioItem} 
                        labelStyle={styles.radioLabelStyle}
                      />
                      <RadioButton.Item 
                        label="Low (Best Quality)" 
                        value="low" 
                        color="#00B5AD"
                        style={styles.verticalRadioItem} 
                        labelStyle={styles.radioLabelStyle}
                      />
                    </View>
                  </RadioButton.Group>
                </Card.Content>
              </Card>
            )}

            <CustomButton
              title="Process & Convert"
              onPress={processConversion}
              disabled={!selectedFormat}
              icon="sync"
              style={[
                styles.processBtn,
                selectedFormat === 'pdf' && { backgroundColor: '#4361EE' },
                selectedFormat === 'ocr' && { backgroundColor: '#F59E0B' },
                selectedFormat === 'compress' && { backgroundColor: '#00B5AD' },
              ]}
            />
          </View>
        )}

        {/* Step 3: Result view */}
        {result && (
          <View style={styles.resultSection}>
            <Card style={styles.successCard}>
              <Card.Content style={styles.successHeader}>
                <IconButton icon="check-circle" iconColor="green" size={32} />
                <Text variant="titleLarge" style={styles.successTitle}>Scan Successfully!</Text>
              </Card.Content>
            </Card>

            {/* Display for PDF or Compress */}
            {result.type !== 'ocr' ? (
              <View>
                <Card style={styles.resultCompareCard}>
                  <Card.Content style={styles.compareRow}>
                    <View style={styles.compareItem}>
                      <Text variant="labelMedium" style={styles.compareLabel}>ORIGINAL</Text>
                      <Text variant="headlineSmall" style={styles.compareValue}>{result.originalSize}</Text>
                    </View>
                    <View style={styles.compareDivider} />
                    <View style={styles.compareItem}>
                      <Text variant="labelMedium" style={[styles.compareLabel, { color: 'green' }]}>CONVERTED</Text>
                      <Text variant="headlineSmall" style={[styles.compareValue, { color: 'green' }]}>{result.compressedSize}</Text>
                    </View>
                  </Card.Content>
                </Card>

                {result.type === 'compress' && (
                  <Card style={styles.previewResultCard}>
                    <Card.Content style={styles.previewResultContent}>
                      <View style={styles.imageWrapper}>
                        {previewLoading && (
                          <ActivityIndicator 
                            animating={true} 
                            color="#00B5AD" 
                            style={styles.imageLoader} 
                          />
                        )}
                        <Image 
                          source={{ uri: getPreviewUrl() }} 
                          style={styles.resultImage} 
                          onLoadStart={() => setPreviewLoading(true)}
                          onLoadEnd={() => setPreviewLoading(false)}
                        />
                      </View>
                      <Text variant="bodySmall" style={styles.previewCaption}>Optimized Output Preview</Text>
                    </Card.Content>
                  </Card>
                )}

                <View style={styles.actionRow}>
                  <Button
                    mode="contained"
                    icon="download"
                    style={[
                      styles.actionBtn,
                      result.type === 'pdf' && { backgroundColor: '#4361EE' },
                      result.type === 'compress' && { backgroundColor: '#00B5AD' }
                    ]}
                    onPress={handleDownload}
                  >
                    Download
                  </Button>
                  <Button
                    mode="outlined"
                    icon="share-variant"
                    style={[
                      styles.actionBtn,
                      result.type === 'pdf' && { borderColor: '#4361EE' },
                      result.type === 'compress' && { borderColor: '#00B5AD' }
                    ]}
                    textColor={result.type === 'pdf' ? '#4361EE' : '#00B5AD'}
                    onPress={handleShare}
                  >
                    Share
                  </Button>
                </View>
              </View>
            ) : (
              // Display for OCR
              <Card style={styles.ocrResultCard}>
                <Card.Content>
                  {result.structuredData && Object.keys(result.structuredData).length > 0 && (
                    <View style={styles.structuredSection}>
                      <Text variant="titleMedium" style={styles.sectionHeading}>Structured Fields ({result.compressedSize.toUpperCase()})</Text>
                      {Object.entries(result.structuredData).map(([key, val]) => (
                        <View key={key} style={styles.ocrDataRow}>
                          <Text variant="bodyMedium" style={styles.ocrDataKey}>
                            {key.replace(/([A-Z])/g, ' $1').toUpperCase()}:
                          </Text>
                          <Text variant="bodyMedium" style={styles.ocrDataVal}>{val as string}</Text>
                        </View>
                      ))}
                      <Divider style={{ marginVertical: 12 }} />
                    </View>
                  )}
                  <Text variant="titleMedium" style={styles.sectionHeading}>Extracted Text</Text>
                  <ScrollView style={styles.extractedScroll}>
                    <Text style={styles.extractedText}>{result.extractedText}</Text>
                  </ScrollView>

                  <View style={styles.actionRow}>
                    <Button
                      mode="contained"
                      icon="content-copy"
                      style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
                      onPress={handleCopyToClipboard}
                    >
                      Copy
                    </Button>
                    <Button
                      mode="outlined"
                      icon="share-variant"
                      style={[styles.actionBtn, { borderColor: '#F59E0B' }]}
                      textColor="#F59E0B"
                      onPress={handleShare}
                    >
                      Share
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            )}

            <Button
              mode="text"
              style={styles.anotherBtn}
              textColor={theme.colors.placeholder}
              onPress={() => {
                setScannedImage(null);
                setResult(null);
                setSelectedFormat(null);
              }}
            >
              Scan Another Document
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Loading Dialog Overlay */}
      <Portal>
        <Dialog visible={isProcessing} dismissable={false} style={styles.modernDialog}>
          <Dialog.Content style={styles.dialogCenterContent}>
            <ActivityIndicator
              animating={true}
              color={getActiveColor()}
              size="large"
              style={styles.dialogSpinner}
            />
            <Text variant="titleLarge" style={[styles.dialogProcessingTitle, { color: getActiveColor() }]}>
              Processing Scan
            </Text>
            <Text variant="bodyMedium" style={styles.dialogMessage}>
              Uploading scan and compiling document. Please wait...
            </Text>
          </Dialog.Content>
        </Dialog>

        {/* Success/Error Alerts */}
        <Dialog visible={!!errorMsg} onDismiss={() => setErrorMsg(null)} style={styles.modernDialog}>
          <Dialog.Content style={styles.dialogCenterContent}>
            <IconButton icon="alert-circle-outline" iconColor={theme.colors.error} size={48} style={styles.dialogIcon} />
            <Text variant="titleLarge" style={styles.dialogErrorTitle}>Something went wrong</Text>
            <Text variant="bodyMedium" style={styles.dialogMessage}>{errorMsg}</Text>
            <Button 
              mode="contained" 
              onPress={() => setErrorMsg(null)} 
              style={[styles.dialogBtn, { backgroundColor: theme.colors.error }]}
              labelStyle={styles.dialogBtnLabel}
            >
              Try Again
            </Button>
          </Dialog.Content>
        </Dialog>

        <Dialog visible={!!successMsg} onDismiss={() => setSuccessMsg(null)} style={styles.modernDialog}>
          <Dialog.Content style={styles.dialogCenterContent}>
            <IconButton icon="check-circle-outline" iconColor={getSuccessColor()} size={48} style={styles.dialogIcon} />
            <Text variant="titleLarge" style={[styles.dialogSuccessTitle, { color: getSuccessColor() }]}>Saved Successfully!</Text>
            <Text variant="bodyMedium" style={styles.dialogMessage}>{successMsg}</Text>
            <Button 
              mode="contained" 
              onPress={() => setSuccessMsg(null)} 
              style={[styles.dialogBtn, { backgroundColor: getSuccessColor() }]}
              labelStyle={styles.dialogBtnLabel}
            >
              Great
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>
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
    justifyContent: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  scannerGraphic: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyIcon: {
    backgroundColor: '#EEF2FF',
    margin: 0,
  },
  scanBeam: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: 'rgba(67, 97, 238, 0.4)',
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 1,
    top: 75,
  },
  pickTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  pickSubtitle: {
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
  },
  pickBtn: {
    width: '100%',
  },
  workflowSection: {
    flex: 1,
  },
  imagePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  previewMeta: {
    flex: 1,
    marginLeft: 12,
  },
  previewFileName: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  previewFileSize: {
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  formatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formatCard: {
    flex: 0.31,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  formatIcon: {
    margin: 0,
  },
  formatTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 4,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  settingsHeader: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioItem: {
    flex: 0.48,
    paddingHorizontal: 0,
  },
  processBtn: {
    marginTop: 16,
  },
  resultSection: {
    flex: 1,
  },
  successCard: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 0,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  successTitle: {
    fontWeight: 'bold',
    color: 'green',
    marginLeft: 4,
  },
  resultCompareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },
  compareItem: {
    alignItems: 'center',
    flex: 1,
  },
  compareLabel: {
    color: theme.colors.placeholder,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  compareValue: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  compareDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
  },
  previewResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewResultContent: {
    alignItems: 'center',
    padding: 12,
    width: '100%',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'contain',
  },
  previewCaption: {
    marginTop: 6,
    color: theme.colors.placeholder,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  imageLoader: {
    position: 'absolute',
    zIndex: 1,
  },
  verticalRadioGroup: {
    marginTop: 8,
  },
  verticalRadioItem: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  radioLabelStyle: {
    fontSize: 14,
    color: '#334155',
  },
  modernDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    width: '85%',
  },
  dialogCenterContent: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  dialogSpinner: {
    marginVertical: 16,
  },
  dialogProcessingTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogIcon: {
    margin: 0,
    marginBottom: 8,
  },
  dialogSuccessTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogErrorTitle: {
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogMessage: {
    textAlign: 'center',
    color: '#475569',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  dialogBtn: {
    borderRadius: 10,
    width: '100%',
    paddingVertical: 2,
  },
  dialogBtnLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  ocrResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeading: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  structuredSection: {
    marginBottom: 12,
  },
  ocrDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ocrDataKey: {
    fontWeight: 'bold',
    color: theme.colors.placeholder,
    fontSize: 12,
  },
  ocrDataVal: {
    fontWeight: '600',
    color: theme.colors.text,
    fontSize: 12,
  },
  extractedScroll: {
    maxHeight: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 16,
  },
  extractedText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionBtn: {
    flex: 0.48,
    borderRadius: 8,
  },
  anotherBtn: {
    alignSelf: 'center',
  },
  progressBar: {
    marginTop: 16,
    height: 6,
    borderRadius: 4,
  },
  progressText: {
    color: theme.colors.text,
  },
});
