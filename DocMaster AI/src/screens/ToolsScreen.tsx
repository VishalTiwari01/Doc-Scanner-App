import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../styles/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

export const ToolsScreen = ({ navigation }: any) => {
  const tools = [
    {
      id: 'compress',
      title: 'PDF Compress',
      subtitle: 'Reduce file size without quality loss',
      icon: 'file-pdf-box',
      color: '#4361EE',       // Indigo
      bgColor: '#EEF2FF',
      borderColor: 'rgba(67, 97, 238, 0.15)',
      screen: 'PdfCompress',
    },
    {
      id: 'image_compress',
      title: 'Image Compress',
      subtitle: 'Resize and optimize images instantly',
      icon: 'image-filter-vintage',
      color: '#00B5AD',       // Teal Accent
      bgColor: '#E6FFFA',
      borderColor: 'rgba(0, 181, 173, 0.15)',
      screen: 'ImageCompress',
    },
    {
      id: 'jpg2pdf',
      title: 'JPG To PDF',
      subtitle: 'Convert images seamlessly',
      icon: 'image-multiple',
      color: '#10B981',       // Emerald Green
      bgColor: '#ECFDF5',
      borderColor: 'rgba(16, 185, 129, 0.15)',
      screen: 'JpgToPdf',
    },
    {
      id: 'ocr',
      title: 'OCR Scanner',
      subtitle: 'Extract text from scans accurately',
      icon: 'text-recognition',
      color: '#F59E0B',       // Amber Accent
      bgColor: '#FEF3C7',
      borderColor: 'rgba(245, 158, 11, 0.15)',
      screen: 'OcrScanner',
    },
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'Settings, Subscription, Account',
      icon: 'account',
      color: '#8B5CF6',       // Violet Accent
      bgColor: '#F5F3FF',
      borderColor: 'rgba(139, 92, 246, 0.15)',
      screen: 'Profile',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text variant="headlineSmall" style={styles.title}>All Document Tools</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Access our complete suite of file utility and image processing tools.
      </Text>

      <View style={styles.grid}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            activeOpacity={0.9}
            style={[styles.card, { shadowColor: tool.color, borderColor: tool.borderColor }]}
            onPress={() => navigation.navigate(tool.screen)}
          >
            <View style={styles.cardContent}>
              <View style={[styles.cardIconContainer, { backgroundColor: tool.bgColor, borderColor: tool.borderColor }]}>
                <MaterialCommunityIcons name={tool.icon} size={26} color={tool.color} />
              </View>
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardSubtitle}>{tool.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.placeholder,
    marginBottom: 28,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
});
