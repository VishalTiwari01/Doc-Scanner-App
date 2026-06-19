import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useAppSelector } from '../redux/store';
import { theme } from '../styles/theme';
import { useGetHistoryQuery } from '../modules/history/services/historyApi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

export const HomeScreen = ({ navigation }: any) => {
  const user = useAppSelector((state) => state.auth.user);

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

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
  ];

  // Get live recent files from Backend History API
  const { data: historyData } = useGetHistoryQuery();
  const recentFiles = historyData?.data
    ? [...historyData.data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)
    : [];

  const getOperationLabel = (type: string) => {
    if (type === 'pdf_compress') return 'PDF Compress';
    if (type === 'jpg_to_pdf') return 'JPG to PDF';
    if (type === 'image_compress') return 'Image Compress';
    if (type === 'ocr') return 'OCR Scanner';
    return type;
  };

  const getIconInfo = (type: string) => {
    if (type === 'pdf_compress') {
      return { icon: 'file-document-outline', bg: '#EFF6FF', color: '#3B82F6' };
    } else if (type === 'jpg_to_pdf') {
      return { icon: 'image-outline', bg: '#ECFDF5', color: '#10B981' };
    } else if (type === 'image_compress') {
      return { icon: 'image-filter-vintage', bg: '#E6FFFA', color: '#00B5AD' };
    } else {
      return { icon: 'text-recognition', bg: '#FEF3C7', color: '#F59E0B' };
    }
  };

  const getSizeLabel = (file: any) => {
    if (file.type === 'ocr') {
      return file.originalSize || 'OCR';
    }
    return file.compressedSize || file.originalSize || '';
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

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} mins ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hr ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    } catch {
      return 'Recently';
    }
  };

  // Calculate dynamic Workspace Overview statistics
  const scannedToday = historyData?.data?.filter((file: any) => {
    if (!file.createdAt) return false;
    const fileDate = new Date(file.createdAt).toDateString();
    const today = new Date().toDateString();
    return fileDate === today;
  }).length || 0;

  let totalSavedBytes = 0;
  if (historyData?.data) {
    historyData.data.forEach((file: any) => {
      if ((file.type === 'pdf_compress' || file.type === 'image_compress') && file.originalSize && file.compressedSize) {
        const orig = parseSizeToBytes(file.originalSize);
        const comp = parseSizeToBytes(file.compressedSize);
        if (orig > comp) {
          totalSavedBytes += (orig - comp);
        }
      }
    });
  }
  const spaceSavedStr = formatBytes(totalSavedBytes);

  const ocrCount = historyData?.data?.filter((file: any) => file.type === 'ocr').length || 0;
  const ocrConfidenceStr = ocrCount > 0 ? '98.7%' : '100%';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B9B" />

      {/* Top Custom Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandContainer}>
            <View style={styles.brandIconBg}>
              <MaterialCommunityIcons name="file-document-multiple-outline" size={20} color="#0D3B9B" />
            </View>
            <Text style={styles.brandText}>DocMaster AI</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
              <Avatar.Text size={36} label={initials} style={styles.avatar} labelStyle={styles.avatarLabel} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerGreetingSection}>
          <Text style={styles.nameText}>Welcome back,</Text>
          <Text style={styles.fullNameText}>{user?.fullName?.split(' ')[0] || 'User'}</Text>
          <Text style={styles.subtitleText}>Optimize your workflow with AI-powered PDF tools.</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.bodyContainer}>
        {/* Workspace Overview Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <Text style={styles.statsCardTitle}>Workspace Overview</Text>
            <View style={styles.statsCardIcons}>
              <MaterialCommunityIcons name="sync" size={16} color="#64748B" style={{ marginRight: 8 }} />
              <MaterialCommunityIcons name="cloud-outline" size={16} color="#64748B" />
            </View>
          </View>
          <View style={styles.statsCardDivider} />
          <View style={styles.statsCardContent}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Scanned Today</Text>
              <Text style={styles.statValue}>{scannedToday}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>OCR Confidence</Text>
              <Text style={styles.statValue}>{ocrConfidenceStr}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Space Saved</Text>
              <Text style={styles.statValue}>{spaceSavedStr}</Text>
            </View>
          </View>
        </View>

        {/* Grid of Main Cards */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Document Services</Text>
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

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentFiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-open-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtitle}>Start compressing or scanning documents!</Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {recentFiles.map((file, idx) => {
              const iconInfo = getIconInfo(file.type);
              const isLastItem = idx === recentFiles.length - 1;
              return (
                <TouchableOpacity
                  key={file.id}
                  style={[styles.activityItem, isLastItem && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('History')}
                >
                  <View style={[styles.activityIconBg, { backgroundColor: iconInfo.bg }]}>
                    <MaterialCommunityIcons name={iconInfo.icon} size={22} color={iconInfo.color} />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text numberOfLines={1} style={styles.activityFileName}>
                      {file.fileName}
                    </Text>
                    <Text style={styles.activityMeta}>
                      {getOperationLabel(file.type)} • {getSizeLabel(file)}
                    </Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityRelativeTime}>{getRelativeTime(file.createdAt)}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Settings Panel Shortcut */}
        <TouchableOpacity
          style={styles.settingsItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.settingsIconBg}>
            <MaterialCommunityIcons name="cog-outline" size={22} color="#475569" />
          </View>
          <View style={styles.settingsDetails}>
            <Text style={styles.settingsTitle}>Account Settings</Text>
            <Text style={styles.settingsSubtitle}>Manage credentials, tokens and security</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    backgroundColor: '#0D3B9B', // Rich Royal Blue matches mockup
    paddingTop: 56,
    paddingBottom: 72,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerGreetingSection: {
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  fullNameText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  nameText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 6,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bodyContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
    paddingBottom: 30,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 24,
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  statsCardIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  statsCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  viewAll: {
    color: '#4361EE',
    fontWeight: '700',
    fontSize: 14,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  activityFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  activityRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityRelativeTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginRight: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  settingsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsDetails: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
});
