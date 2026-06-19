import React, { useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Platform, Alert } from 'react-native';
import { Text, Card, Avatar, Divider, Portal, Dialog, Button, Chip, IconButton } from 'react-native-paper';
import { useGetHistoryQuery, useDeleteHistoryItemMutation, HistoryItem } from '../services/historyApi';
import { FileService } from '../../../services/fileService';
import { theme } from '../../../styles/theme';

export const HistoryScreen = () => {
  const { data, isLoading, refetch, isFetching } = useGetHistoryQuery();
  const [selectedOcr, setSelectedOcr] = useState<HistoryItem | null>(null);
  const [deleteHistoryItem] = useDeleteHistoryItemMutation();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDelete = (item: HistoryItem) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete "${item.fileName}" from your activity history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteHistoryItem(item.id).unwrap();
              if (res.success) {
                setSuccessMsg('Record deleted from history');
              }
            } catch (err: any) {
              setErrorMsg(err.data?.message || 'Failed to delete record');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = async (item: HistoryItem) => {
    setDownloadingId(item.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const savedPath = await FileService.saveFileToDevice(
        item.resultUrl,
        `DocMaster_${item.fileName}`
      );
      setSuccessMsg(`Saved to: ${savedPath}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (item: HistoryItem) => {
    let mimeType = 'application/pdf';
    if (item.type === 'ocr') {
      mimeType = 'text/plain';
    } else if (item.type === 'image_compress') {
      // Basic extension check for sharing mimeType
      const isPng = item.fileName.toLowerCase().endsWith('.png');
      mimeType = isPng ? 'image/png' : 'image/jpeg';
    }
    
    try {
      // Because Cloudinary restricts public PDF delivery by default (ACL failure),
      // we must download the file locally using our proxy, then share the actual file.
      const savedPath = await FileService.saveFileToDevice(
        item.resultUrl,
        `Share_${item.fileName}`
      );
      
      const shareUrl = Platform.OS === 'android' ? `file://${savedPath}` : savedPath;
      
      await FileService.shareFile(
        shareUrl,
        mimeType,
        `Share ${item.fileName}`
      );
    } catch (error) {
      console.error("Error sharing file:", error);
      Alert.alert("Share Failed", "Could not prepare file for sharing.");
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const isPdfOrImage = item.type === 'pdf_compress' || item.type === 'jpg_to_pdf' || item.type === 'image_compress';
    
    // Icon configurations
    let iconName = 'file-pdf-box';
    let iconBg = '#FFEBE8';
    let iconColor = '#FF5722';
    let badgeText = '';

    if (item.type === 'pdf_compress') {
      badgeText = 'Compressed';
      iconBg = '#FFEBE8';
      iconColor = '#FF5722';
    } else if (item.type === 'jpg_to_pdf') {
      badgeText = 'JPG to PDF';
      iconBg = '#E8F1FF';
      iconColor = '#4361EE';
    } else if (item.type === 'image_compress') {
      badgeText = 'Image Opt';
      iconName = 'image-filter-vintage';
      iconBg = '#E6FFFA';
      iconColor = '#00B5AD';
    } else {
      badgeText = 'OCR Scan';
      iconName = 'text-recognition';
      iconBg = '#E2F9FF';
      iconColor = '#00A8CC';
    }

    return (
      <Card
        style={styles.card}
        onPress={() => {
          if (item.type === 'ocr') {
            setSelectedOcr(item);
          }
        }}
      >
        <Card.Title
          title={item.fileName}
          titleNumberOfLines={1}
          subtitle={formatDate(item.createdAt)}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon={iconName}
              style={{ backgroundColor: iconBg }}
              color={iconColor}
            />
          )}
          right={() => (
            <Chip style={styles.badge} textStyle={styles.badgeText}>
              {badgeText}
            </Chip>
          )}
        />
        <Card.Content style={styles.cardContent}>
          {isPdfOrImage ? (
            <View style={styles.metaRow}>
               <Text variant="bodyMedium" style={styles.metaLabel}>Original: </Text>
               <Text variant="bodyMedium" style={styles.metaValue}>{item.originalSize}</Text>
               <Text variant="bodyMedium" style={styles.metaLabel}>  •  Output: </Text>
               <Text variant="bodyMedium" style={[styles.metaValue, styles.successText]}>
                 {item.compressedSize}
               </Text>
            </View>
          ) : (
            <View style={styles.metaRow}>
              <Text variant="bodyMedium" style={styles.metaLabel}>Type: </Text>
              <Text variant="bodyMedium" style={styles.metaValue}>
                {item.compressedSize ? item.compressedSize.toUpperCase() : 'GENERIC'}
              </Text>
              <Text variant="bodyMedium" style={styles.metaLabel}>  •  Text size: </Text>
              <Text variant="bodyMedium" style={styles.metaValue}>{item.originalSize}</Text>
            </View>
          )}
        </Card.Content>
        <Divider style={styles.divider} />
        <Card.Actions style={styles.actions}>
          <Button
            icon="trash-can-outline"
            mode="text"
            textColor={theme.colors.error}
            onPress={() => handleDelete(item)}
          >
            Delete
          </Button>
          {isPdfOrImage && (
            <Button
              icon="download"
              mode="text"
              loading={downloadingId === item.id}
              disabled={downloadingId !== null}
              onPress={() => handleDownload(item)}
            >
              Download
            </Button>
          )}
          <Button icon="share-variant" mode="text" onPress={() => handleShare(item)}>
            Share
          </Button>
          {item.type === 'ocr' && (
            <Button icon="eye" mode="text" onPress={() => setSelectedOcr(item)}>
              View Text
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.data || []}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        refreshing={isFetching}
        onRefresh={refetch}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Avatar.Icon icon="history" size={64} style={styles.emptyIcon} color={theme.colors.placeholder} />
              <Text variant="headlineSmall" style={styles.emptyTitle}>No Activity Yet</Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Your compressed PDFs, converted documents, and OCR scans will appear here.
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : null
        }
      />

      <Portal>
        {/* OCR Result Detailed dialog */}
        <Dialog visible={!!selectedOcr} onDismiss={() => setSelectedOcr(null)} style={styles.ocrDialog}>
          <Dialog.Title>OCR Details: {selectedOcr?.compressedSize?.toUpperCase()}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <FlatList
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={
                <View style={styles.ocrDetailContent}>
                  {selectedOcr?.structuredData && Object.keys(selectedOcr.structuredData).length > 0 && (
                    <View style={styles.structuredSection}>
                      <Text variant="titleMedium" style={styles.sectionHeading}>Structured Fields</Text>
                      {Object.entries(selectedOcr.structuredData).map(([key, val]) => (
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
                  <Text style={styles.extractedText}>{selectedOcr?.extractedText}</Text>
                </View>
              }
            />
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setSelectedOcr(null)}>Close</Button>
          </Dialog.Actions>
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
            <IconButton icon="check-circle-outline" iconColor="#FF5722" size={48} style={styles.dialogIcon} />
            <Text variant="titleLarge" style={styles.dialogSuccessTitle}>Success</Text>
            <Text variant="bodyMedium" style={styles.dialogMessage}>{successMsg}</Text>
            <Button 
              mode="contained" 
              onPress={() => setSuccessMsg(null)} 
              style={[styles.dialogBtn, { backgroundColor: '#FF5722' }]}
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    paddingTop: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  badge: {
    marginRight: 8,
    backgroundColor: '#F1F5F9',
    height: 28,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaLabel: {
    color: theme.colors.placeholder,
  },
  metaValue: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  successText: {
    color: 'green',
  },
  divider: {
    backgroundColor: '#F1F5F9',
  },
  actions: {
    justifyContent: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    backgroundColor: '#F1F5F9',
    margin: 0,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 24,
  },
  ocrDialog: {
    backgroundColor: '#FFFFFF',
    maxHeight: '80%',
  },
  dialogScroll: {
    paddingHorizontal: 16,
  },
  ocrDetailContent: {
    paddingVertical: 8,
  },
  structuredSection: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
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
  extractedText: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: theme.colors.text,
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
  dialogIcon: {
    margin: 0,
    marginBottom: 8,
  },
  dialogSuccessTitle: {
    fontWeight: 'bold',
    color: '#FF5722',
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
});
