import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  Share2, 
  Heart,
  ChevronLeft
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ArticleDetailModal() {
  const router = useRouter();
  const { title, content, author, date, category } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/knowledge');
            }
          }}
        >
          <X size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIcon}><Heart size={20} color="#64748b" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><Share2 size={20} color="#64748b" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category & Title */}
        <View style={styles.catBadge}>
          <Text style={styles.catText}>{category || 'MEDICAL INSIGHT'}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>

        {/* Author Info */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{author ? (author as string).charAt(0) : 'D'}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>Dr. {author || 'AyurLife Expert'}</Text>
            <View style={styles.metaRow}>
              <Calendar size={12} color="#94a3b8" />
              <Text style={styles.metaText}>{date}</Text>
              <View style={styles.dot} />
              <Clock size={12} color="#94a3b8" />
              <Text style={styles.metaText}>5 min read</Text>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          <Text style={styles.bodyText}>{content}</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Disclaimer: This information is for educational purposes only and not a substitute for professional medical advice. Always consult with a qualified Ayurvedic practitioner.
          </Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.consultBtn} onPress={() => router.push('/booking/doctor')}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.gradient}>
            <Text style={styles.consultBtnText}>Book Consultation with Expert</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: { flexDirection: 'row', gap: 15 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { padding: 25 },
  catBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
  catText: { fontSize: 11, fontWeight: '900', color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b', lineHeight: 36, marginBottom: 25 },
  
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30, backgroundColor: '#f8fafc', padding: 15, borderRadius: 20 },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#059669' },
  authorName: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1', marginHorizontal: 4 },
  
  contentBody: { marginBottom: 30 },
  bodyText: { fontSize: 17, color: '#334155', lineHeight: 28, fontWeight: '500' },
  
  disclaimer: { backgroundColor: '#fef2f2', padding: 20, borderRadius: 15, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  disclaimerText: { fontSize: 13, color: '#991b1b', lineHeight: 20, fontWeight: '600' },
  
  bottomBar: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 8 }
    })
  },
  consultBtn: { borderRadius: 15, overflow: 'hidden' },
  gradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  consultBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
