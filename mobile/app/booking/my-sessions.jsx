import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Modal, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, X, Leaf } from 'lucide-react-native';
import api from '../../services/api';
import { useRouter } from 'expo-router';

const STATUS_CONFIG = {
  pending:   { color: '#f59e0b', bg: '#fffbeb', label: 'PENDING' },
  confirmed: { color: '#3b82f6', bg: '#eff6ff', label: 'CONFIRMED' },
  completed: { color: '#10b981', bg: '#ecfdf5', label: 'COMPLETED' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'CANCELLED' },
};

export default function MySessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/wellness/my-bookings');
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f43f5e" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Therapy Sessions</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSessions(); }} tintColor="#f43f5e" />}
      >
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Heart size={48} color="#fda4af" />
            <Text style={styles.emptyTitle}>No Sessions Yet</Text>
            <Text style={styles.emptySub}>Your booked therapy sessions will appear here.</Text>
          </View>
        ) : (
          sessions.map(session => {
            const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
            return (
              <TouchableOpacity
                key={session._id}
                style={styles.card}
                onPress={() => { setSelected(session); setModalVisible(true); }}
              >
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <Leaf size={20} color="#f43f5e" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.therapyName}>{session.therapy?.name || 'Wellness Therapy'}</Text>
                    <View style={styles.metaRow}>
                      <Calendar size={12} color="#94a3b8" />
                      <Text style={styles.meta}>{new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                      <Clock size={12} color="#94a3b8" />
                      <Text style={styles.meta}>{session.time}</Text>
                    </View>
                    {session.roomNumber && (
                      <Text style={styles.roomText}>Room: {session.roomNumber} • {session.assignedTherapistName}</Text>
                    )}
                  </View>
                  <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                {session.status === 'completed' && session.therapy?.careInstructions && (
                  <View style={styles.careHint}>
                    <CheckCircle2 size={12} color="#10b981" />
                    <Text style={styles.careHintText}>Care instructions available</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>THERAPY</Text>
                  <Text style={styles.detailValue}>{selected.therapy?.name}</Text>

                  <View style={{ flexDirection: 'row', gap: 20 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>DATE</Text>
                      <Text style={styles.detailValue}>{new Date(selected.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>TIME</Text>
                      <Text style={styles.detailValue}>{selected.time}</Text>
                    </View>
                  </View>

                  <Text style={styles.detailLabel}>STATUS</Text>
                  <View style={[styles.badge, { alignSelf: 'flex-start', marginBottom: 15, backgroundColor: (STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending).bg }]}>
                    <Text style={[styles.badgeText, { color: (STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending).color }]}>
                      {(STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending).label}
                    </Text>
                  </View>

                  <Text style={styles.detailLabel}>PAYMENT</Text>
                  <Text style={styles.detailValue}>{selected.paymentMethod} — {selected.paymentStatus?.toUpperCase()}</Text>

                  {selected.roomNumber && (
                    <>
                      <Text style={styles.detailLabel}>ALLOCATED RESOURCES</Text>
                      <Text style={styles.detailValue}>Room {selected.roomNumber} • {selected.assignedTherapistName}</Text>
                    </>
                  )}

                  {selected.notes && (
                    <>
                      <Text style={styles.detailLabel}>YOUR NOTES</Text>
                      <Text style={styles.detailValue}>{selected.notes}</Text>
                    </>
                  )}
                </View>

                {selected.status === 'completed' && selected.therapy?.careInstructions && (
                  <View style={styles.careBox}>
                    <View style={styles.careHeader}>
                      <Heart size={16} color="#e11d48" />
                      <Text style={styles.careTitle}>Post-Treatment Care</Text>
                    </View>
                    <Text style={styles.careText}>{selected.therapy.careInstructions}</Text>
                  </View>
                )}

                {selected.status === 'completed' && !selected.therapy?.careInstructions && (
                  <View style={[styles.careBox, { backgroundColor: '#f8fafc' }]}>
                    <Text style={[styles.careText, { color: '#94a3b8', textAlign: 'center' }]}>No care instructions provided.</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1f2937' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  therapyName: { fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  roomText: { fontSize: 11, color: '#10b981', fontWeight: '700', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 9, fontWeight: '900' },
  careHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  careHintText: { fontSize: 11, color: '#10b981', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1f2937' },
  detailBox: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 16 },
  detailLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 14 },
  careBox: { backgroundColor: '#fff1f2', borderRadius: 20, padding: 20, marginBottom: 20 },
  careHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  careTitle: { fontSize: 14, fontWeight: '900', color: '#e11d48' },
  careText: { fontSize: 14, color: '#be123c', lineHeight: 22 },
});
