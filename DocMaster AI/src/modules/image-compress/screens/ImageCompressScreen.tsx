import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { Text, Card, List, Button, Portal, Dialog, IconButton, Divider } from 'react-native-paper';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import { FileService } from '../../../services/fileService';
import { useCompressImageMutation } from '../services/imageCompressApi';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';


export const ImageCompressScreen = () => {
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [compressionLevel, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [compressImage, { isLoading }] = useCompressImageMutation();
  
  // Results states
  const [result, setResult] = useState<{
    fileName: string;
    originalSize: string;
    compressedSize: string;
    downloadUrl: string;
    historyId: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const handlePickImage = () => {
    setErrorMsg(null);
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          setErrorMsg(response.errorMessage || 'Image picking error');
        } else if (response.assets && response.assets.length > 0) {
          setSelectedImage(response.assets[0]);
          setResult(null); // Clear previous results
        }
      }
    );
  };

  const handleCaptureImage = () => {
    setErrorMsg(null);
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
          setSelectedImage(response.assets[0]);
          setResult(null); // Clear previous results
        }
      }
    );
  };

  const handleCompress = async () => {
    if (!selectedImage) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('image', {
      uri: selectedImage.uri,
      name: selectedImage.fileName || `image_${Date.now()}.jpg`,
      type: selectedImage.type || 'image/jpeg',
    } as any);
    
    formData.append('compressionLevel', compressionLevel);

    try {
      const response = await compressImage(formData).unwrap();
      if (response && response.success) {
        setResult({
          fileName: response.fileName,
          originalSize: response.originalSize,
          compressedSize: response.compressedSize,
          downloadUrl: response.downloadUrl,
          historyId: response.historyId,
        });
      } else {
        setErrorMsg('Image compression failed. Please try again.');
      }
    } catch (err: any) {
      console.log('Image compression error:', err);
      setErrorMsg(err.data?.message || 'Server error during image compression');
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const savedPath = await FileService.saveFileToDevice(
        result.downloadUrl,
        `DocMaster_${result.fileName}`
      );
      setSuccessMsg(`Saved to: ${savedPath}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download compressed image');
    }
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      const type = selectedImage?.type || 'image/jpeg';
      await FileService.shareFile(
        result.downloadUrl,
        type,
        `Share ${result.fileName}`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to share file');
    }
  };

  const parseSizeToBytes = (sizeStr: string): number => {
    if (!sizeStr) return 0;
    const value = parseFloat(sizeStr);
    if (isNaN(value)) return 0;
    if (sizeStr.includes('GB')) return value * 1024 * 1024 * 1024;
    if (sizeStr.includes('MB')) return value * 1024 * 1024;
    if (sizeStr.includes('KB')) return value * 1024;
    return value;
  };

  const calculateSavings = () => {
    if (!result) return 0;
    const originalBytes = parseSizeToBytes(result.originalSize);
    const compressedBytes = parseSizeToBytes(result.compressedSize);
    if (originalBytes === 0 || originalBytes <= compressedBytes) return 0;
    return Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
  };

  const compressionLevels = [
    {
      id: 'low',
      title: 'Low Compression',
      desc: 'High image quality, minimal size reduction',
      icon: 'image-outline',
    },
    {
      id: 'medium',
      title: 'Recommended',
      desc: 'Good image quality, balanced file size',
      icon: 'image-filter-vintage',
    },
    {
      id: 'high',
      title: 'High Compression',
      desc: 'Max size reduction, lower resolution/quality',
      icon: 'image-size-select-small',
    },
  ];

  const savingsPercent = calculateSavings();

  // Dynamically resolve URL for preview
  const getPreviewUrl = () => {
    if (result) {
      // In local mode, resultUrl is like /uploads/compressed_...
      // Prepended with base URL by FileService/client
      if (result.downloadUrl.startsWith('http')) {
        return result.downloadUrl;
      }
      const host = __DEV__
        ? (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')
        : 'https://docmaster-backend.onrender.com';
      return `${host}${result.downloadUrl}`;
    }
    return selectedImage?.uri;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* State 1: No image selected */}
        {!selectedImage && (
          <View style={styles.emptyContainer}>
            <IconButton icon="image-filter-hdr" iconColor="#00B5AD" size={64} style={styles.pickIcon} />
            <Text variant="headlineSmall" style={styles.pickTitle}>Compress Image</Text>
            <Text variant="bodyMedium" style={styles.pickSubtitle}>
              Optimize JPEG, PNG, or WebP images instantly without losing clarity.
            </Text>
            
            <CustomButton
              title="Select from Gallery"
              onPress={handlePickImage}
              icon="image-outline"
              style={styles.pickBtn}
            />
            <CustomButton
              title="Take a Photo"
              onPress={handleCaptureImage}
              mode="outlined"
              icon="camera-outline"
              style={styles.pickBtn}
              
            />
          </View>
        )}

        {/* State 2: Image selected, configure and compress */}
        {selectedImage && !result && (
          <View style={styles.workflowSection}>
            <Card style={styles.imagePreviewCard}>
              <Card.Content style={styles.previewContent}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <View style={styles.previewMeta}>
                  <Text variant="bodyLarge" numberOfLines={1} style={styles.previewFileName}>
                    {selectedImage.fileName || 'Selected Photo'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.previewFileSize}>
                    Original Size: {selectedImage.fileSize ? formatBytes(selectedImage.fileSize) : 'Analyzing...'}
                  </Text>
                </View>
                <IconButton
                  icon="close-circle"
                  iconColor={theme.colors.error}
                  size={24}
                  style={styles.closeBtn}
                  onPress={() => setSelectedImage(null)}
                />
              </Card.Content>
            </Card>

            <Text variant="titleMedium" style={styles.sectionTitle}>Select Compression Level</Text>
            {compressionLevels.map((level) => {
              const isSelected = compressionLevel === level.id;
              return (
                <Card
                  key={level.id}
                  style={[
                    styles.levelCard,
                    isSelected && { borderColor: '#00B5AD', borderWidth: 1.5 },
                  ]}
                  onPress={() => setLevel(level.id as any)}
                >
                  <Card.Title
                    title={level.title}
                    subtitle={level.desc}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={level.icon}
                        color={isSelected ? '#00B5AD' : theme.colors.placeholder}
                      />
                    )}
                    right={(props) => (
                      <IconButton
                        {...props}
                        icon={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                        iconColor={isSelected ? '#00B5AD' : theme.colors.placeholder}
                      />
                    )}
                  />
                </Card>
              );
            })}

            <CustomButton
              title="Optimize & Compress"
              onPress={handleCompress}
              icon="image-filter-vintage"
              style={[styles.compressBtn, { backgroundColor: '#00B5AD' }]}
            />
          </View>
        )}

        {/* State 3: Compression complete, show results */}
        {result && (
          <View style={styles.resultSection}>
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.title}>Compression Complete!</Text>
              <Text variant="titleMedium" style={styles.reductionText}>
                Your image is now <Text style={styles.percentText}>{savingsPercent}% smaller</Text>!
              </Text>
            </View>

            {/* Visual Graph Card */}
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.chartTitle}>Image Size Comparison</Text>
                
                {/* Original Bar */}
                <View style={styles.barContainer}>
                  <View style={styles.barLabelRow}>
                    <Text variant="bodyLarge" style={styles.barLabel}>Original Image</Text>
                    <Text variant="bodyLarge" style={styles.barSizeText}>{result.originalSize}</Text>
                  </View>
                  <View style={styles.backgroundBar}>
                    <View style={[styles.filledBar, styles.originalBar]} />
                  </View>
                </View>

                {/* Optimized Bar */}
                <View style={styles.barContainer}>
                  <View style={styles.barLabelRow}>
                    <Text variant="bodyLarge" style={styles.barLabel}>Optimized Image</Text>
                    <Text variant="bodyLarge" style={[styles.barSizeText, styles.compressedText]}>{result.compressedSize}</Text>
                  </View>
                  <View style={styles.backgroundBar}>
                    <View 
                      style={[
                        styles.filledBar, 
                        styles.compressedBar, 
                        { width: `${Math.max(15, 100 - savingsPercent)}%` }
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
                  <Text variant="bodyLarge" style={styles.detailValue} numberOfLines={1}>{result.fileName}</Text>
                </View>
                <Divider style={styles.divider} />
                
                <View style={styles.detailRow}>
                  <Text variant="bodyLarge" style={styles.detailLabel}>Original Size</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>{result.originalSize}</Text>
                </View>
                <Divider style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text variant="bodyLarge" style={styles.detailLabel}>Optimized Size</Text>
                  <Text variant="bodyLarge" style={[styles.detailValue, styles.compressedText]}>{result.compressedSize}</Text>
                </View>
                <Divider style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text variant="bodyLarge" style={styles.detailLabel}>Total Savings</Text>
                  <Text variant="bodyLarge" style={[styles.detailValue, styles.savingsValue]}>
                    {savingsPercent}% Reduction
                  </Text>
                </View>
              </Card.Content>
            </Card>

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
                <Text variant="bodySmall" style={styles.previewCaption}>Optimized Image Preview</Text>
              </Card.Content>
            </Card>

            <View style={styles.actionButtons}>
              <CustomButton
                title="Download to Device"
                onPress={handleDownload}
                icon="download"
                style={[styles.btn, { backgroundColor: '#00B5AD' }]}
              />
              <CustomButton
                title="Share Image"
                onPress={handleShare}
                mode="outlined"
                icon="share-variant"
                style={[styles.btn, { borderColor: '#00B5AD' }]}
                textColor="#00B5AD"
              />
              <CustomButton
                title="Compress Another Image"
                onPress={() => {
                  setSelectedImage(null);
                  setResult(null);
                }}
                mode="text"
                style={styles.doneBtn}
                textColor={theme.colors.placeholder}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Loading Dialog */}
      <Portal>
        <Dialog visible={isLoading} dismissable={false} style={styles.modernDialog}>
          <Dialog.Content style={styles.dialogCenterContent}>
            <ActivityIndicator
              animating={true}
              color="#00B5AD"
              size="large"
              style={styles.dialogSpinner}
            />
            <Text variant="titleLarge" style={[styles.dialogProcessingTitle, { color: '#00B5AD' }]}>
              Compressing Image
            </Text>
            <Text variant="bodyMedium" style={styles.dialogMessage}>
              Uploading and optimizing your image. Please wait...
            </Text>
          </Dialog.Content>
        </Dialog>

        {/* Dialog notifications */}
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
            <IconButton icon="check-circle-outline" iconColor="#00B5AD" size={48} style={styles.dialogIcon} />
            <Text variant="titleLarge" style={styles.dialogSuccessTitle}>Saved Successfully!</Text>
            <Text variant="bodyMedium" style={styles.dialogMessage}>{successMsg}</Text>
            <Button 
              mode="contained" 
              onPress={() => setSuccessMsg(null)} 
              style={[styles.dialogBtn, { backgroundColor: '#00B5AD' }]}
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
    shadowColor: '#00B5AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  pickIcon: {
    backgroundColor: '#E6FFFA',
    margin: 0,
  },
  pickTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
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
    marginBottom: 12,
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
  closeBtn: {
    margin: 0,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    borderColor: 'transparent',
    borderWidth: 1.5,
  },
  compressBtn: {
    marginTop: 20,
  },
  resultSection: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
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
    color: '#00B5AD',
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
    backgroundColor: '#00B5AD', // Teal saving bar
  },
  compressedText: {
    color: '#00B5AD',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    marginBottom: 20,
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
    color: '#00B5AD',
    fontWeight: 'bold',
  },
  divider: {
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
    color: '#00B5AD',
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
  actionButtons: {
    marginBottom: 20,
  },
  btn: {
    marginBottom: 12,
  },
  doneBtn: {
    marginTop: 8,
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
