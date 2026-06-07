import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, List, Button, Portal, Dialog, ProgressBar, IconButton } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { setSelectedFile, setCompressionLevel, setCompressedResult } from '../../../redux/slices/pdfSlice';
import { FileService } from '../../../services/fileService';
import { useCompressPDFMutation } from '../services/compressApi';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';

export const PdfCompressScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { selectedFile, compressionLevel } = useAppSelector((state) => state.pdf);
  const [compressPDF, { isLoading }] = useCompressPDFMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handlePickFile = async () => {
    setErrorMsg(null);
    const result = await FileService.pickPDF();
    if (result) {
      dispatch(setSelectedFile({
        name: result.name || 'document.pdf',
        size: result.size || 0,
        uri: result.uri,
        type: result.type || 'application/pdf',
      }));
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setErrorMsg(null);
    
    // Create multi-part form data
    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.type || 'application/pdf',
    } as any);
    
    formData.append('compressionLevel', compressionLevel);

    try {
      const result = await compressPDF(formData).unwrap();
      if (result && result.success) {
        dispatch(setCompressedResult({
          fileName: result.fileName,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          downloadUrl: result.downloadUrl,
          historyId: result.historyId,
        }));
        // Navigate to result
        navigation.navigate('CompressedResult');
      } else {
        setErrorMsg('Compression failed. Please try again.');
      }
    } catch (err: any) {
      console.log('PDF Compress error:', err);
      setErrorMsg(err.data?.message || 'Server error during PDF compression');
    }
  };

  const compressionLevels = [
    {
      id: 'low',
      title: 'Low Compression',
      desc: 'High PDF quality, larger file size',
      icon: 'file-check-outline',
    },
    {
      id: 'medium',
      title: 'Recommended Compression',
      desc: 'Good PDF quality, medium file size',
      icon: 'file-percent-outline',
    },
    {
      id: 'high',
      title: 'High Compression',
      desc: 'Less quality, smallest file size',
      icon: 'file-image-outline',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step 1: Pick PDF */}
        {!selectedFile ? (
          <Card style={styles.pickCard} onPress={handlePickFile}>
            <Card.Content style={styles.pickContent}>
              <IconButton icon="file-pdf-box" iconColor={theme.colors.primary} size={64} style={styles.pickIcon} />
              <Text variant="headlineSmall" style={styles.pickTitle}>Select PDF Document</Text>
              <Text variant="bodyMedium" style={styles.pickSubtitle}>Tap here to choose a file from your device</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.fileCard}>
            <Card.Title
              title={selectedFile.name}
              subtitle={formatBytes(selectedFile.size)}
              left={(props) => <List.Icon {...props} icon="file-pdf-box" color={theme.colors.primary} />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="close-circle"
                  iconColor={theme.colors.error}
                  onPress={() => dispatch(setSelectedFile(null))}
                />
              )}
            />
          </Card>
        )}

        {/* Step 2: Select Compression Level */}
        {selectedFile && (
          <View style={styles.levelSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Select Compression Level</Text>
            
            {compressionLevels.map((level) => {
              const isSelected = compressionLevel === level.id;
              return (
                <Card
                  key={level.id}
                  style={[
                    styles.levelCard,
                    isSelected && { borderColor: theme.colors.primary, borderWidth: 1.5 },
                  ]}
                  onPress={() => dispatch(setCompressionLevel(level.id as any))}
                >
                  <Card.Title
                    title={level.title}
                    subtitle={level.desc}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={level.icon}
                        color={isSelected ? theme.colors.primary : theme.colors.placeholder}
                      />
                    )}
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
              title="Compress PDF"
              onPress={handleCompress}
              icon="file-pdf-box"
              style={styles.compressBtn}
            />
          </View>
        )}
      </ScrollView>

      {/* Upload/Compression Loading Dialog */}
      <Portal>
        <Dialog visible={isLoading} dismissable={false}>
          <Dialog.Title>Compressing Document</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.progressText}>Uploading and optimizing your PDF file. Please do not close the app...</Text>
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
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
  },
  pickContent: {
    alignItems: 'center',
  },
  pickIcon: {
    backgroundColor: '#EEF2FF',
    margin: 0,
  },
  pickTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
  },
  pickSubtitle: {
    color: theme.colors.placeholder,
    marginTop: 8,
    textAlign: 'center',
  },
  fileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  levelSection: {
    flex: 1,
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
  progressBar: {
    marginTop: 16,
    height: 6,
    borderRadius: 4,
  },
  progressText: {
    color: theme.colors.text,
  },
});
