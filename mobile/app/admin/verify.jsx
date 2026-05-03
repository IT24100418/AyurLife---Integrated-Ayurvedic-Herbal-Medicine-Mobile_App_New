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
  Image,
} from 'react-native';
import {
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  User as UserIcon,
  FileText,
  Clock,
  Stethoscope,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import Config from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

const SERVER_BASE = Config.BASE_URL.replace('/api', '');

export default function VerificationScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/doctors');
      setAllDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const handleVerify = (doctor, status) => {
    const actionLabel = status === 'approved' ? 'Approve' : 'Reject';
    const message = status === 'approved'
      ? `Approve Dr. ${doctor.user?.name}? They will gain full platform access.`
      : `Reject Dr. ${doctor.user?.name}? Their account will be flagged.`;

    Alert.alert(
      `${actionLabel} Doctor`,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: status === 'approved' ? 'default' : 'destructive',
          onPress: () => verifyDoctor(doctor._id, status),
        },
      ]
    );
  };

  const verifyDoctor = async (id, status) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/doctors/${id}/verify`, { status });
      Alert.alert(
        'Success ✓',
        `Doctor has been ${status === 'approved' ? 'approved and verified' : 'rejected'}.`
      );
      fetchDoctors();
    } catch (error) {
      Alert.alert('Error', 'Failed to update doctor status.');
    } finally {
      setActionLoading(null);
    }
  };

  const pending = allDoctors.filter(d => d.verificationStatus === 'pending');
  const approved = allDoctors.filter(d => d.verificationStatus === 'approved');
  const rejected = allDoctors.filter(d => d.verificationStatus === 'rejected');

  const getFilteredList = () => {
    if (tab === 'pending') return pending;
    if (tab === 'approved') return approved;
    return rejected;
  };

  const DoctorCard = ({ item }) => {
    const isPending = item.verificationStatus === 'pending';
    const isApproved = item.verificationStatus === 'approved';
    const isRejected = item.verificationStatus === 'rejected';
    const isLoading = actionLoading === item._id;

    return (
      <View style={[styles.card, isApproved && styles.cardApproved, isRejected && styles.cardRejected]}>
        {/* Card Header */}
        <View style={styles.cardTop}>
          <View style={[
            styles.avatar,
            isApproved && { backgroundColor: '#dcfce7' },
            isRejected && { backgroundColor: '#fee2e2' },
            isPending && { backgroundColor: '#eff6ff' },
          ]}>
            {isApproved ? (
              <BadgeCheck size={26} color="#059669" />
            ) : isRejected ? (
              <ShieldAlert size={26} color="#ef4444" />
            ) : (
              <UserIcon size={26} color="#3b82f6" />
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.doctorName}>Dr. {item.user?.name || 'Unknown'}</Text>
            <Text style={styles.specialization}>{item.specialization}</Text>
          </View>

          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            isApproved && styles.badgeApproved,
            isRejected && styles.badgeRejected,
            isPending && styles.badgePending,
          ]}>
            <Text style={[
              styles.badgeText,
              isApproved && { color: '#059669' },
              isRejected && { color: '#ef4444' },
              isPending && { color: '#d97706' },
            ]}>
              {isApproved ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <FileText size={14} color="#94a3b8" />
            <Text style={styles.detailText}>License: <Text style={styles.detailValue}>{item.licenseNumber}</Text></Text>
          </View>
          {item.experienceYears != null && (
            <View style={styles.detailRow}>
              <Clock size={14} color="#94a3b8" />
              <Text style={styles.detailText}>Experience: <Text style={styles.detailValue}>{item.experienceYears} Years</Text></Text>
            </View>
          )}
          {item.hospitalAffiliation && (
            <View style={styles.detailRow}>
              <Stethoscope size={14} color="#94a3b8" />
              <Text style={styles.detailText}>Hospital: <Text style={styles.detailValue}>{item.hospitalAffiliation}</Text></Text>
            </View>
          )}
          {item.user?.email && (
            <View style={styles.detailRow}>
              <ShieldCheck size={14} color="#94a3b8" />
              <Text style={styles.detailText}>Email: <Text style={styles.detailValue}>{item.user.email}</Text></Text>
            </View>
          )}
          {isApproved && item.verifiedAt && (
            <View style={styles.detailRow}>
              <CheckCircle2 size={14} color="#059669" />
              <Text style={[styles.detailText, { color: '#059669' }]}>
                Verified on: {new Date(item.verifiedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          )}
        </View>

        {/* License Document Preview */}
        {item.licenseDocument ? (
          <View style={styles.licenseSection}>
            <View style={styles.licenseTitleRow}>
              <FileText size={14} color="#3b82f6" />
              <Text style={styles.licenseSectionTitle}>License Document</Text>
              <View style={styles.licenseUploadedBadge}>
                <Text style={styles.licenseUploadedText}>UPLOADED</Text>
              </View>
            </View>
            <Image
              source={{ uri: `${SERVER_BASE}${item.licenseDocument}` }}
              style={styles.licenseImage}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.noLicenseBox}>
            <FileText size={16} color="#94a3b8" />
            <Text style={styles.noLicenseText}>No license document uploaded yet.</Text>
          </View>
        )}

        {/* Action Buttons */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleVerify(item, 'rejected')}
              disabled={!!actionLoading}
            >
              <XCircle size={18} color="#ef4444" />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleVerify(item, 'approved')}
              disabled={!!actionLoading}
            >
              <LinearGradient colors={['#059669', '#047857']} style={styles.approveGradient}>
                <CheckCircle2 size={18} color="#fff" />
                <Text style={styles.approveText}>Approve & Verify</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isApproved && (
          <View style={styles.approvedFooter}>
            <CheckCircle2 size={16} color="#059669" />
            <Text style={styles.approvedFooterText}>This doctor is fully verified and active on the platform.</Text>
            <TouchableOpacity
              style={styles.revokeBtn}
              onPress={() => handleVerify(item, 'rejected')}
              disabled={!!actionLoading}
            >
              <Text style={styles.revokeText}>Revoke</Text>
            </TouchableOpacity>
          </View>
        )}

        {isRejected && (
          <View style={styles.rejectedFooter}>
            <AlertTriangle size={16} color="#ef4444" />
            <Text style={styles.rejectedFooterText}>Application rejected.</Text>
            <TouchableOpacity
              style={styles.reApproveBtn}
              onPress={() => handleVerify(item, 'approved')}
              disabled={!!actionLoading}
            >
              <Text style={styles.reApproveText}>Re-Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.cardOverlay}>
            <ActivityIndicator color="#3b82f6" size="large" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Doctor Verification</Text>
            <Text style={styles.headerSub}>Manage practitioner credentials</Text>
          </View>
        </View>

        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.1)' }]}>
            <Text style={[styles.summaryNum, { color: '#fbbf24' }]}>{pending.length}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.1)' }]}>
            <Text style={[styles.summaryNum, { color: '#4ade80' }]}>{approved.length}</Text>
            <Text style={styles.summaryLabel}>Verified</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <Text style={[styles.summaryNum, { color: '#f87171' }]}>{rejected.length}</Text>
            <Text style={styles.summaryLabel}>Rejected</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          { key: 'pending', label: 'Pending', count: pending.length },
          { key: 'approved', label: 'Verified', count: approved.length },
          { key: 'rejected', label: 'Rejected', count: rejected.length },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            <View style={[
              styles.tabCount,
              tab === t.key && styles.tabCountActive,
              t.key === 'pending' && { backgroundColor: tab === t.key ? '#d97706' : '#fef3c7' },
              t.key === 'approved' && { backgroundColor: tab === t.key ? '#059669' : '#dcfce7' },
              t.key === 'rejected' && { backgroundColor: tab === t.key ? '#ef4444' : '#fee2e2' },
            ]}>
              <Text style={[
                styles.tabCountText,
                tab === t.key && { color: '#fff' },
                t.key === 'pending' && tab !== t.key && { color: '#d97706' },
                t.key === 'approved' && tab !== t.key && { color: '#059669' },
                t.key === 'rejected' && tab !== t.key && { color: '#ef4444' },
              ]}>{t.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {getFilteredList().length === 0 ? (
            <View style={styles.emptyState}>
              {tab === 'pending' ? (
                <>
                  <CheckCircle2 size={60} color="#dcfce7" />
                  <Text style={styles.emptyTitle}>Queue Clear!</Text>
                  <Text style={styles.emptyText}>No pending verification requests.</Text>
                </>
              ) : tab === 'approved' ? (
                <>
                  <ShieldCheck size={60} color="#e0f2fe" />
                  <Text style={styles.emptyTitle}>No Verified Doctors</Text>
                  <Text style={styles.emptyText}>Approved doctors will appear here.</Text>
                </>
              ) : (
                <>
                  <ShieldAlert size={60} color="#fee2e2" />
                  <Text style={styles.emptyTitle}>No Rejected Doctors</Text>
                  <Text style={styles.emptyText}>Rejected applications will appear here.</Text>
                </>
              )}
            </View>
          ) : (
            getFilteredList().map(item => (
              <DoctorCard key={item._id} item={item} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 15, paddingHorizontal: 20, paddingBottom: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  summaryNum: { fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#1e293b' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  tabTextActive: { color: '#1e293b', fontWeight: '900' },
  tabCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  tabCountActive: {},
  tabCountText: { fontSize: 10, fontWeight: '900' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginTop: 20, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9', position: 'relative', overflow: 'hidden' },
  cardApproved: { borderColor: '#bbf7d0', borderLeftWidth: 4, borderLeftColor: '#059669' },
  cardRejected: { borderColor: '#fecaca', borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  headerInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '900', color: '#1f2937' },
  specialization: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgePending: { backgroundColor: '#fef3c7' },
  badgeApproved: { backgroundColor: '#dcfce7' },
  badgeRejected: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  detailsBox: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 18, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  detailValue: { color: '#1f2937', fontWeight: '800' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 50, borderRadius: 14, overflow: 'hidden' },
  rejectBtn: { borderWidth: 1, borderColor: '#fee2e2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff' },
  approveBtn: { overflow: 'hidden' },
  approveGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  approveText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  rejectText: { color: '#ef4444', fontWeight: '800', fontSize: 13 },

  approvedFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', padding: 12, borderRadius: 14 },
  approvedFooterText: { flex: 1, fontSize: 11, color: '#166534', fontWeight: '600' },
  revokeBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  revokeText: { fontSize: 11, fontWeight: '900', color: '#ef4444' },

  rejectedFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', padding: 12, borderRadius: 14 },
  rejectedFooterText: { flex: 1, fontSize: 11, color: '#991b1b', fontWeight: '600' },
  reApproveBtn: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  reApproveText: { fontSize: 11, fontWeight: '900', color: '#059669' },

  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', borderRadius: 24 },

  // License Document
  licenseSection: { marginBottom: 18, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#bfdbfe' },
  licenseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', padding: 12 },
  licenseSectionTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: '#1e40af' },
  licenseUploadedBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  licenseUploadedText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  licenseImage: { width: '100%', height: 200, backgroundColor: '#f1f5f9' },
  noLicenseBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  noLicenseText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
});
