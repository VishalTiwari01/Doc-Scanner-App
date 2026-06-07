import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, Clipboard, Alert, Platform } from 'react-native';
import { Text, Card, Button, Portal, Dialog, ProgressBar, List, IconButton, Divider } from 'react-native-paper';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import { useProcessOCRMutation, OCRResponse } from '../services/ocrApi';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';

export const OcrScannerScreen = () => {
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [ocrType, setOcrType] = useState<'generic' | 'aadhaar' | 'pan' | 'passport'>('generic');
  const [processOCR, { isLoading }] = useProcessOCRMutation();
  const [ocrResult, setOcrResult] = useState<OCRResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          setErrorMsg(response.errorMessage || 'Image picking error');
        } else if (response.assets && response.assets.length > 0) {
          setSelectedImage(response.assets[0]);
          setOcrResult(null);
        }
      }
    );
  };

  const handleCaptureImage = () => {
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
          setOcrResult(null);
        }
      }
    );
  };

  const handleScan = async () => {
    if (!selectedImage) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('image', {
      uri: selectedImage.uri,
      name: selectedImage.fileName || 'scan.jpg',
      type: selectedImage.type || 'image/jpeg',
    } as any);
    
    formData.append('documentType', ocrType);

    try {
      const result = await processOCR(formData).unwrap();
      if (result && result.success) {
        setOcrResult(result);
      } else {
        setErrorMsg('OCR extraction failed. Try again with a clearer picture.');
      }
    } catch (err: any) {
      console.log('OCR scan error:', err);
      setErrorMsg(err.data?.message || 'Server error during OCR scanning');
    }
  };

  const handleCopyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Text has been copied to your clipboard.');
  };

  const clearScanState = () => {
    setSelectedImage(null);
    setOcrResult(null);
  };

  const ocrTypes = [
    { id: 'generic', title: 'Generic OCR', desc: 'Extract raw text' },
    { id: 'aadhaar', title: 'Aadhaar OCR', desc: 'Name, DOB, ID, Gender' },
    { id: 'pan', title: 'PAN OCR', desc: 'Name, Father Name, DOB, ID' },
    { id: 'passport', title: 'Passport OCR', desc: 'Name, Passport#, Nationality, DOB' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Step 1: Input Selection or Preview */}
        {!selectedImage ? (
          <Card style={styles.pickCard}>
            <Card.Content style={styles.pickContent}>
              <IconButton icon="text-recognition" iconColor={theme.colors.primary} size={64} style={styles.pickIcon} />
              <Text variant="headlineSmall" style={styles.pickTitle}>OCR Scan Document</Text>
              <Text variant="bodyMedium" style={styles.pickSubtitle}>
                Snap a photo or upload an image card to extract printed text.
              </Text>
              
              <CustomButton
                title="Select from Gallery"
                onPress={handlePickImage}
                icon="image-outline"
                style={styles.pickBtn}
              />
              <CustomButton
                title="Capture from Camera"
                onPress={handleCaptureImage}
                mode="outlined"
                icon="camera-outline"
                style={styles.pickBtn}
              />
            </Card.Content>
          </Card>
        ) : (
          <View>
            <Card style={styles.previewCard}>
              <View style={styles.previewRow}>
                <Image source={{ uri: selectedImage.uri }} style={styles.thumbnail} />
                <View style={styles.previewDetails}>
                  <Text variant="titleMedium" numberOfLines={1}>{selectedImage.fileName || 'Scanned Document'}</Text>
                  <Text variant="bodySmall" style={styles.imageSize}>
                    {selectedImage.fileSize ? `${(selectedImage.fileSize / 1024).toFixed(0)} KB` : ''}
                  </Text>
                </View>
                <IconButton icon="close-circle" iconColor={theme.colors.error} onPress={clearScanState} />
              </View>
            </Card>

            {/* Select Scanner Engine */}
            {!ocrResult && (
              <View style={styles.ocrTypeSection}>
                <Text variant="titleLarge" style={styles.sectionTitle}>Select Scan Type</Text>
                
                {ocrTypes.map((type) => {
                  const isSelected = ocrType === type.id;
                  return (
                    <Card
                      key={type.id}
                      style={[
                        styles.typeCard,
                        isSelected && { borderColor: theme.colors.primary, borderWidth: 1.5 },
                      ]}
                      onPress={() => setOcrType(type.id as any)}
                    >
                      <Card.Title
                        title={type.title}
                        subtitle={type.desc}
                        right={(props) => (
                          <IconButton
                            {...props}
                            icon={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                            iconColor={isSelected ? theme.colors.primary : theme.colors.placeholder}
                          />
                        )}
                      />
                    </Card>
                  );
                })}

                <CustomButton
                  title="Run OCR Scan"
                  onPress={handleScan}
                  icon="text-recognition"
                  style={styles.scanBtn}
                />
              </View>
            )}
          </View>
        )}

        {/* Step 2: Show Scan Results */}
        {ocrResult && (
          <View style={styles.resultSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Scan Results</Text>
            
            {ocrResult.documentType !== 'generic' && ocrResult.structuredData && (
              <Card style={styles.structuredCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>Structured Metadata</Text>
                  
                  {ocrResult.documentType === 'aadhaar' && (
                    <>
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Name</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.name}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Aadhaar Number</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.aadhaarNumber}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Date of Birth</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.dob}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Gender</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.gender}</Text>
                      </View>
                    </>
                  )}

                  {ocrResult.documentType === 'pan' && (
                    <>
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Name</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.name}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Father's Name</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.fatherName}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>PAN Number</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.panNumber}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Date of Birth</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.dob}</Text>
                      </View>
                    </>
                  )}

                  {ocrResult.documentType === 'passport' && (
                    <>
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.name}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Passport Number</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.passportNumber}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Nationality</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.nationality}</Text>
                      </View>
                      <Divider />
                      <View style={styles.resultField}>
                        <Text style={styles.fieldLabel}>Date of Birth</Text>
                        <Text style={styles.fieldValue}>{ocrResult.structuredData.dob}</Text>
                      </View>
                    </>
                  )}
                </Card.Content>
              </Card>
            )}

            <Card style={styles.rawTextCard}>
              <Card.Content>
                <View style={styles.rawTextHeader}>
                  <Text variant="titleMedium" style={styles.cardTitle}>Raw Extracted Text</Text>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => handleCopyToClipboard(ocrResult.extractedText)}
                  />
                </View>
                <ScrollView style={styles.rawTextScroll}>
                  <Text style={styles.rawTextValue}>{ocrResult.extractedText}</Text>
                </ScrollView>
              </Card.Content>
            </Card>

            <CustomButton
              title="Scan Another Document"
              onPress={clearScanState}
              icon="camera-retake-outline"
              style={styles.doneBtn}
            />
          </View>
        )}
      </ScrollView>

      {/* Loading Dialog */}
      <Portal>
        <Dialog visible={isLoading} dismissable={false}>
          <Dialog.Title>Running OCR Scan</Dialog.Title>
          <Dialog.Content>
            <Text>Scanning card elements and extracting structured alphanumeric details. Please wait...</Text>
            <ProgressBar indeterminate color={theme.colors.primary} style={styles.progressBar} />
          </Dialog.Content>
        </Dialog>

        <Dialog visible={!!errorMsg} onDismiss={() => setErrorMsg(null)}>
          <Dialog.Title style={{ color: theme.colors.error }}>Error</Dialog.Title>
          <Dialog.Content>
            <Text>{errorMsg}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setErrorMsg(null)}>OK</Button>
          </Dialog.Actions>
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
  },
  pickCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    elevation: 2,
  },
  pickContent: {
    alignItems: 'center',
  },
  pickIcon: {
    backgroundColor: '#EFF6FF',
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
    paddingHorizontal: 16,
  },
  pickBtn: {
    width: '100%',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  previewDetails: {
    flex: 1,
    marginLeft: 12,
  },
  imageSize: {
    color: theme.colors.placeholder,
  },
  ocrTypeSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderRadius: 12,
    elevation: 1,
    borderColor: 'transparent',
    borderWidth: 1.5,
  },
  scanBtn: {
    marginTop: 16,
  },
  resultSection: {
    marginTop: 10,
  },
  structuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  resultField: {
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 4,
  },
  rawTextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    marginBottom: 20,
  },
  rawTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rawTextScroll: {
    maxHeight: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rawTextValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  doneBtn: {
    marginBottom: 20,
  },
  progressBar: {
    marginTop: 16,
    height: 6,
    borderRadius: 4,
  },
});
