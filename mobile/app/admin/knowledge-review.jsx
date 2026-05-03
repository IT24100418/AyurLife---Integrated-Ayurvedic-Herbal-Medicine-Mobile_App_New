import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import {
  ChevronLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  User,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function KnowledgeReviewScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const fetchArticles = async () => {
    try {
      const { data } = await api.get('/knowledge/all');
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
      Alert.alert('Error', 'Failed to load articles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handlePublish = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/knowledge/${id}/publish`);
      Alert.alert('Published!', 'The article is now visible to all patients.');
      fetchArticles();
    } catch (error) {
      Alert.alert('Error', 'Failed to publish article');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Article',
      'Are you sure you want to remove this article? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/knowledge/${id}`);
              fetchArticles();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete article');
            }
          }
        }
      ]
    );
  };

  const pending = articles.filter(a => a.status === 'pending');
  const published = articles.filter(a => a.status === 'published');

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Article Review</Text>
            <Text style={styles.headerSub}>Verify and publish medical content</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchArticles(); }} tintColor="#1e293b" />}
      >
        <Text style={styles.sectionTitle}>Pending Approval ({pending.length})</Text>
        {pending.length === 0 ? (
          <View style={styles.emptyBox}>
            <ShieldCheck size={40} color="#e2e8f0" />
            <Text style={styles.emptyText}>No articles awaiting review.</Text>
          </View>
        ) : (
          pending.map(article => (
            <View key={article._id} style={styles.card}>
              <View style={styles.cardInfo}>
                <View style={styles.catBadge}>
                  <Text style={styles.catText}>{article.category}</Text>
                </View>
                <Text style={styles.artTitle}>{article.title}</Text>
                <View style={styles.metaRow}>
                  <User size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>By Dr. {article.author?.user?.name}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => setSelectedArticle(article)}
                >
                  <ExternalLink size={16} color="#3b82f6" />
                  <Text style={styles.viewText}>Read</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={() => handlePublish(article._id)}
                  disabled={actionLoading === article._id}
                >
                  {actionLoading === article._id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} color="#fff" />
                      <Text style={styles.publishBtnText}>Publish</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Published Articles ({published.length})</Text>
        {published.map(article => (
          <View key={article._id} style={[styles.card, styles.publishedCard]}>
            <View style={styles.cardInfo}>
              <Text style={styles.artTitle}>{article.title}</Text>
              <Text style={styles.metaText}>Author: Dr. {article.author?.user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(article._id)}>
              <XCircle size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Article Detail Modal */}
      <Modal visible={!!selectedArticle} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reviewing Article</Text>
              <TouchableOpacity onPress={() => setSelectedArticle(null)}><XCircle size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalArtTitle}>{selectedArticle?.title}</Text>
              <View style={styles.modalMeta}>
                <Text style={styles.modalMetaText}>Category: {selectedArticle?.category}</Text>
                <Text style={styles.modalMetaText}>Author: Dr. {selectedArticle?.author?.user?.name}</Text>
              </View>
              <Text style={styles.modalBody}>{selectedArticle?.content}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalPublishBtn}
              onPress={() => {
                handlePublish(selectedArticle._id);
                setSelectedArticle(null);
              }}
            >
              <Text style={styles.modalPublishText}>Approve & Publish Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  list: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#1e293b', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  publishedCard: { opacity: 0.8 },
  cardInfo: { flex: 1 },
  catBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  catText: { fontSize: 10, fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' },
  artTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8 },
  viewText: { fontSize: 12, fontWeight: '800', color: '#3b82f6' },
  publishBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  publishBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  emptyBox: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  modalScroll: { flex: 1 },
  modalArtTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 10 },
  modalMeta: { marginBottom: 20, gap: 4 },
  modalMetaText: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  modalBody: { fontSize: 16, color: '#334155', lineHeight: 24 },
  modalPublishBtn: { backgroundColor: '#10b981', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  modalPublishText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
