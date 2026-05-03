import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  FlaskConical, 
  Clock, 
  CheckCircle2, 
  Plus, 
  History,
  Beaker,
  TrendingUp,
  X,
  PlusCircle,
  Package,
  ShoppingBag,
  ClipboardList,
  ShieldCheck
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';

export default function BatchesScreen() {
  const router = useRouter();
  const { formulaId, formulaName } = useLocalSearchParams();
  
  const [batches, setBatches] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(!!formulaId);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Batch State
  const [newBatch, setNewBatch] = useState({
    formulationId: formulaId || '',
    batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
    quantityProduced: ''
  });

  // Sync formulaId if it comes from params
  useEffect(() => {
    if (formulaId) {
      setNewBatch(prev => ({ ...prev, formulationId: formulaId as string }));
      setShowAddModal(true);
    }
  }, [formulaId]);

  useEffect(() => {
    fetchBatches();
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    try {
      const { data } = await api.get('/production/my-formulas');
      setFormulas(data);
    } catch (error) {
      console.error('Error fetching formulas:', error);
    }
  };

  // Quality Log State
  const [qualityNote, setQualityNote] = useState('');

  // Release State
  const [releaseInfo, setReleaseInfo] = useState({
    price: '',
    unit: 'Bottles',
    category: 'Processed',
    description: '',
    image: ''
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: uri,
        name: 'product-image.jpg',
        type: 'image/jpeg',
      } as any);

      // We need to get the baseURL for the upload
      const baseURL = api.defaults.baseURL;
      const response = await fetch(`${baseURL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json',
        },
      });

      const data = await response.json();
      if (data.image) {
        setReleaseInfo(prev => ({ ...prev, image: data.image }));
        Alert.alert('Success', 'Product image uploaded!');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const pickLabReport = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadLabReport(result.assets[0].uri);
    }
  };

  const uploadLabReport = async (uri: string) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: uri,
        name: 'lab-report.jpg',
        type: 'image/jpeg',
      } as any);

      const baseURL = api.defaults.baseURL;
      const response = await fetch(`${baseURL}/upload`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });

      const data = await response.json();
      if (data.image) {
        await api.put(`/production/batches/${selectedBatch._id}`, { labReport: data.image });
        Alert.alert('Success', 'Lab report uploaded and verified!');
        fetchBatches();
        setShowLogModal(false);
      }
    } catch (error) {
      console.error('Lab report upload error:', error);
      Alert.alert('Error', 'Failed to upload lab report');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/production/my-batches');
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBatch = async () => {
    if (!newBatch.formulationId || !newBatch.quantityProduced) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
          ...newBatch,
          quantityProduced: Number(newBatch.quantityProduced)
      };
      console.log('Starting batch with payload:', payload);
      await api.post('/production/batches', payload);
      Alert.alert('Success', 'Production Batch started');
      setShowAddModal(false);
      setNewBatch({
          formulationId: '',
          batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
          quantityProduced: ''
      });
      fetchBatches();
    } catch (error: any) {
      console.error('Error starting batch:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start batch. Make sure all fields are correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (batchId, status) => {
    try {
      await api.put(`/production/batches/${batchId}`, { status });
      fetchBatches();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleAddLog = async () => {
    if (!qualityNote) return;
    try {
      await api.put(`/production/batches/${selectedBatch._id}`, { qualityNote });
      Alert.alert('Success', 'Quality log added');
      setShowLogModal(false);
      setQualityNote('');
      fetchBatches();
    } catch (error) {
      Alert.alert('Error', 'Failed to add log');
    }
  };

  const handleReleaseToShop = async () => {
    if (!releaseInfo.price) {
        Alert.alert('Error', 'Please set a price');
        return;
    }
    try {
        setLoading(true);
        await api.post(`/production/batches/${selectedBatch._id}/release`, releaseInfo);
        Alert.alert('Success', 'Products released to Shop!');
        setShowReleaseModal(false);
        fetchBatches();
    } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to release products');
    } finally {
        setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'fermenting': return '#8b5cf6';
      case 'processing': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'bottled': return '#059669';
      default: return '#94a3b8';
    }
  };

  if (loading && batches.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Batches</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtnHeader}>
          <Plus size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={batches}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.sectionSubtitle}>Track fermentation and production stages</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <TrendingUp size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No active production batches</Text>
          </View>
        }
        renderItem={({ item: batch }) => (
          <View style={styles.batchCard}>
            <View style={styles.batchHeader}>
              <View>
                  <Text style={styles.batchLabel}>BATCH #{batch.batchNumber}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.formulaName}>{batch.formulation?.name}</Text>
                      {batch.labReport && (
                          <View style={styles.verifiedBadge}>
                              <ShieldCheck size={12} color="#10b981" />
                              <Text style={styles.verifiedText}>Lab Verified</Text>
                          </View>
                      )}
                  </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(batch.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(batch.status) }]}>{batch.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                    <Text style={styles.progressText}>Current Stage: {batch.status}</Text>
                    <Text style={styles.qtyText}>{batch.quantityProduced} units</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { 
                        backgroundColor: getStatusColor(batch.status),
                        width: batch.status === 'ready' ? '100%' : batch.status === 'fermenting' ? '30%' : '60%' 
                    }]} />
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => {
                      setSelectedBatch(batch);
                      setShowLogModal(true);
                  }}
                >
                    <ClipboardList size={16} color="#64748b" />
                    <Text style={styles.actionBtnText}>Logs ({batch.qualityLogs?.length})</Text>
                </TouchableOpacity>

                {batch.status === 'fermenting' && (
                    <TouchableOpacity style={styles.nextStageBtn} onPress={() => handleUpdateStatus(batch._id, 'processing')}>
                        <Text style={styles.nextText}>Next Stage</Text>
                    </TouchableOpacity>
                )}

                {batch.status === 'processing' && (
                    <TouchableOpacity style={styles.nextStageBtn} onPress={() => handleUpdateStatus(batch._id, 'ready')}>
                        <Text style={styles.nextText}>Mark Ready</Text>
                    </TouchableOpacity>
                )}

                {(batch.status === 'ready' || batch.status === 'bottled') && (
                    <TouchableOpacity 
                      style={styles.releaseBtn} 
                      onPress={() => {
                          setSelectedBatch(batch);
                          setReleaseInfo({
                              price: '',
                              unit: 'Bottles',
                              category: batch.formulation?.type || 'Processed',
                              description: batch.formulation?.method || '',
                              image: ''
                          });
                          setShowReleaseModal(true);
                      }}
                    >
                        <ShoppingBag size={14} color="#fff" />
                        <Text style={styles.releaseText}>Release to Shop</Text>
                    </TouchableOpacity>
                )}
            </View>
          </View>
        )}
      />

      {/* Log Modal */}
      <Modal visible={showLogModal} animationType="slide" transparent={true}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Quality Logs</Text>
                    <TouchableOpacity onPress={() => setShowLogModal(false)}><X size={24} color="#1f2937" /></TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 200 }}>
                      {selectedBatch?.qualityLogs?.map((log, i) => (
                          <View key={i} style={styles.logItem}>
                              <Text style={styles.logDate}>{new Date(log.date).toLocaleDateString()}</Text>
                              <Text style={styles.logNote}>{log.note}</Text>
                          </View>
                      ))}
                  </ScrollView>

                  <Text style={styles.inputLabel}>New Quality Log (Color, Taste, Texture)</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g. Taste: Bitter/Standard, Color: Deep Amber"
                    value={qualityNote}
                    onChangeText={setQualityNote}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  <TouchableOpacity style={styles.saveLogBtn} onPress={handleAddLog}>
                      <Text style={styles.saveLogBtnText}>Add Log</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <Text style={styles.inputLabel}>Lab Verification Report</Text>
                  <TouchableOpacity 
                    style={[styles.labUploadBtn, selectedBatch?.labReport && styles.labUploaded]} 
                    onPress={pickLabReport}
                    disabled={uploadingImage}
                  >
                      {uploadingImage ? (
                          <ActivityIndicator color="#8b5cf6" />
                      ) : selectedBatch?.labReport ? (
                          <View style={styles.labInfo}>
                              <CheckCircle2 size={20} color="#10b981" />
                              <Text style={styles.labText}>Report Uploaded</Text>
                          </View>
                      ) : (
                          <View style={styles.labInfo}>
                              <PlusCircle size={20} color="#8b5cf6" />
                              <Text style={styles.labText}>Upload Test Report</Text>
                          </View>
                      )}
                  </TouchableOpacity>
              </View>
          </KeyboardAvoidingView>
      </Modal>

      {/* Release Modal */}
      <Modal visible={showReleaseModal} animationType="slide" transparent={true}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Release to Shop</Text>
                    <TouchableOpacity onPress={() => setShowReleaseModal(false)}><X size={24} color="#1f2937" /></TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.inputLabel}>Price Per Unit (LKR)</Text>
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. 1500"
                      keyboardType="numeric"
                      value={releaseInfo.price}
                      onChangeText={(val) => setReleaseInfo({ ...releaseInfo, price: val })}
                    />

                    <Text style={styles.inputLabel}>Product Category</Text>
                    <View style={styles.formulaSelector}>
                        {['Arishta', 'Oil', 'Powder', 'Pill', 'Paste', 'Processed'].map((cat) => (
                            <TouchableOpacity 
                              key={cat} 
                              style={[styles.formulaOption, releaseInfo.category === cat && styles.activeFormulaOption]}
                              onPress={() => setReleaseInfo({ ...releaseInfo, category: cat })}
                            >
                                <Text style={[styles.formulaOptionText, releaseInfo.category === cat && styles.activeFormulaText]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.inputLabel}>Product Image</Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={uploadingImage}>
                        {uploadingImage ? (
                            <ActivityIndicator color="#8b5cf6" />
                        ) : releaseInfo.image ? (
                            <View style={styles.imagePreviewContainer}>
                                <Text style={styles.imageSelectedText}>✅ Image Selected</Text>
                                <Text style={styles.imageSubText}>Tap to change</Text>
                            </View>
                        ) : (
                            <View style={styles.imagePickerPlaceholder}>
                                <Plus size={24} color="#94a3b8" />
                                <Text style={styles.imagePickerText}>Upload Product Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>Unit Name</Text>
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. Bottle (750ml)"
                      value={releaseInfo.unit}
                      onChangeText={(val) => setReleaseInfo({ ...releaseInfo, unit: val })}
                    />

                    <TouchableOpacity style={styles.finalReleaseBtn} onPress={handleReleaseToShop} disabled={loading}>
                        <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
                          <Text style={styles.finalReleaseText}>Add to Inventory</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                  </ScrollView>
              </View>
          </KeyboardAvoidingView>
      </Modal>

      {/* Add Batch Modal (Placeholder for starting new) */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Batch</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color="#1f2937" /></TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Select Recipe (Formula)</Text>
              <View style={styles.formulaSelector}>
                  {formulas.map((f: any) => (
                      <TouchableOpacity 
                        key={f._id} 
                        style={[styles.formulaOption, newBatch.formulationId === f._id && styles.activeFormulaOption]}
                        onPress={() => setNewBatch({ ...newBatch, formulationId: f._id })}
                      >
                          <Text style={[styles.formulaOptionText, newBatch.formulationId === f._id && styles.activeFormulaText]}>{f.name}</Text>
                      </TouchableOpacity>
                  ))}
              </View>
              
              {newBatch.formulationId === '' && (
                  <Text style={styles.errorHint}>Please select a recipe first</Text>
              )}
              
              <Text style={styles.inputLabel}>Batch Number</Text>
              <TextInput style={styles.input} value={newBatch.batchNumber} editable={false} />

              <Text style={styles.inputLabel}>Estimated Yield (Units)</Text>
              <TextInput 
                  style={styles.input} 
                  placeholder="Number of bottles/packs" 
                  keyboardType="numeric"
                  value={newBatch.quantityProduced}
                  onChangeText={(val) => setNewBatch({ ...newBatch, quantityProduced: val })}
              />

              <TouchableOpacity style={styles.finalReleaseBtn} onPress={handleStartBatch}>
                  <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
                      <Text style={styles.finalReleaseText}>Begin Production</Text>
                  </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  addBtnHeader: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 25 },
  sectionSubtitle: { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginBottom: 25 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 15, fontWeight: '600' },
  batchCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  batchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  batchLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  formulaName: { fontSize: 18, fontWeight: '900', color: '#1f2937', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900' },
  progressSection: { marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  qtyText: { fontSize: 12, color: '#1f2937', fontWeight: '800' },
  progressBar: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  actionRow: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  actionBtnText: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  nextStageBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  nextText: { fontSize: 13, color: '#1f2937', fontWeight: '800' },
  releaseBtn: { backgroundColor: '#10b981', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  releaseText: { fontSize: 13, color: '#fff', fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  inputLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  logItem: { borderLeftWidth: 2, borderLeftColor: '#e2e8f0', paddingLeft: 15, marginBottom: 15 },
  logDate: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 2 },
  logNote: { fontSize: 13, color: '#1f2937', fontWeight: '600' },
  saveLogBtn: { backgroundColor: '#1f2937', padding: 15, borderRadius: 15, alignItems: 'center' },
  saveLogBtnText: { color: '#fff', fontWeight: '800' },
  finalReleaseBtn: { height: 60, borderRadius: 20, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  finalReleaseText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  formulaSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  formulaOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeFormulaOption: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  formulaOptionText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  activeFormulaText: { color: '#fff' },
  errorHint: { color: '#ef4444', fontSize: 11, fontWeight: '600', marginBottom: 15, marginLeft: 5 },
  imagePicker: { backgroundColor: '#f8fafc', height: 100, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  imagePickerPlaceholder: { alignItems: 'center' },
  imagePickerText: { fontSize: 12, color: '#94a3b8', fontWeight: '700', marginTop: 5 },
  imagePreviewContainer: { alignItems: 'center' },
  imageSelectedText: { fontSize: 14, color: '#10b981', fontWeight: '800' },
  imageSubText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  batchSubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { fontSize: 10, color: '#059669', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  labUploadBtn: { height: 60, borderRadius: 16, backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  labUploaded: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  labInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  labText: { fontSize: 13, fontWeight: '700', color: '#64748b' }
});
