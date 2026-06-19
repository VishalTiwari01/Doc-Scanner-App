import React, { useState } from 'react';
import { StyleSheet, View, Image, FlatList } from 'react-native';
import { Text, Card, IconButton, Portal, Dialog, Button, ProgressBar } from 'react-native-paper';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import { useAppDispatch } from '../../../redux/store';
import { setCompressedResult } from '../../../redux/slices/pdfSlice';
import { useImageToPDFMutation } from '../services/imageToPdfApi';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';

export const JpgToPdfScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [images, setImages] = useState<Asset[]>([]);
  const [convertImages, { isLoading }] = useImageToPDFMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePickImages = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 20,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          setErrorMsg(response.errorMessage || 'Image picking error');
        } else if (response.assets) {
          setImages([...images, ...response.assets]);
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
        } else if (response.assets) {
          setImages([...images, ...response.assets]);
        }
      }
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const list = [...images];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    setImages(list);
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    const list = [...images];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    setImages(list);
  };

  const removeImage = (index: number) => {
    const list = [...images];
    list.splice(index, 1);
    setImages(list);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setErrorMsg(null);

    const formData = new FormData();
    images.forEach((img, index) => {
      formData.append('images', {
        uri: img.uri,
        name: img.fileName || `image_${index}.jpg`,
        type: img.type || 'image/jpeg',
      } as any);
    });

    try {
      const result = await convertImages(formData).unwrap();
      if (result && result.success) {
        dispatch(setCompressedResult({
          fileName: `DocMaster_Compiled_${Date.now().toString().slice(-4)}.pdf`,
          originalSize: result.originalSize || `${images.length} Images`,
          compressedSize: result.pdfSize || 'Generating...',
          downloadUrl: result.pdfUrl,
          historyId: result.historyId,
        }));
        navigation.navigate('CompressedResult');
      } else {
        setErrorMsg('Conversion failed. Please try again.');
      }
    } catch (err: any) {
      console.log('Conversion error:', err);
      setErrorMsg(err.data?.message || 'Server error during PDF conversion');
    }
  };

  return (
    <View style={styles.container}>
      {images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton icon="image-multiple" iconColor={theme.colors.primary} size={64} style={styles.emptyIcon} />
          <Text variant="headlineSmall" style={styles.emptyTitle}>Select Images</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Add photos from your gallery or capture from camera to build your PDF document.
          </Text>
          
          <CustomButton
            title="Choose from Gallery"
            onPress={handlePickImages}
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
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text variant="titleMedium" style={styles.listHeader}>
            Selected Images ({images.length}) - Order of Pages
          </Text>

          <FlatList
            data={images}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            renderItem={({ item, index }) => (
              <Card style={styles.imageCard}>
                <View style={styles.cardRow}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                  <View style={styles.cardDetails}>
                    <Text variant="bodyLarge" numberOfLines={1} style={styles.imageName}>
                      Page {index + 1}: {item.fileName || 'Photo'}
                    </Text>
                    <Text variant="bodySmall" style={styles.imageSize}>
                      {item.fileSize ? `${(item.fileSize / 1024).toFixed(0)} KB` : ''}
                    </Text>
                  </View>
                  
                  {/* Reordering Controls */}
                  <View style={styles.controls}>
                    <IconButton
                      icon="arrow-up"
                      size={20}
                      disabled={index === 0}
                      onPress={() => moveUp(index)}
                    />
                    <IconButton
                      icon="arrow-down"
                      size={20}
                      disabled={index === images.length - 1}
                      onPress={() => moveDown(index)}
                    />
                    <IconButton
                      icon="trash-can-outline"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={() => removeImage(index)}
                    />
                  </View>
                </View>
              </Card>
            )}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Button mode="outlined" icon="plus" onPress={handlePickImages} style={styles.addMoreBtn}>
                Add More
              </Button>
              <Button mode="outlined" icon="camera" onPress={handleCaptureImage} style={styles.addMoreBtn}>
                Camera
              </Button>
            </View>
            <CustomButton
              title="Convert to PDF"
              onPress={handleConvert}
              icon="file-pdf-box"
              style={styles.convertBtn}
            />
          </View>
        </View>
      )}

      {/* Loading Dialog */}
      <Portal>
        <Dialog visible={isLoading} dismissable={false}>
          <Dialog.Title>Generating PDF</Dialog.Title>
          <Dialog.Content>
            <Text>Uploading images and compiling them into a high-quality PDF. Please wait...</Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    backgroundColor: '#FFF0EB',
    margin: 0,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 20,
  },
  emptySubtitle: {
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  pickBtn: {
    width: '100%',
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderRadius: 10,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
  },
  imageName: {
    fontWeight: '600',
    color: theme.colors.text,
    fontSize: 14,
  },
  imageSize: {
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addMoreBtn: {
    flex: 0.48,
    borderRadius: 8,
  },
  convertBtn: {
    width: '100%',
  },
  progressBar: {
    marginTop: 16,
    height: 6,
    borderRadius: 4,
  },
});
