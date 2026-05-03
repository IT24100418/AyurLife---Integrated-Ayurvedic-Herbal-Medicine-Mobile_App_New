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
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Config from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Heart,
  Tag,
  X,
  PlusCircle,
  Save
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';

const { width } = Dimensions.get('window');

interface Therapy {
  _id: string;
  name: string;
  description: string;
  durationMinutes: number | string;
  price: number | string;
  category: string;
  image: string;
  careInstructions?: string;
}

interface Booking {
  _id: string;
  patient: { name: string };
  therapy: { name: string };
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export default function ManageTherapiesScreen() {
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTherapy, setEditingTherapy] = useState<Therapy | null>(null);
  const [activeTab, setActiveTab] = useState('services');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: '',
    price: '',
    category: 'General',
    image: '',
    careInstructions: ''
  });
  const [uploading, setUploading] = useState(false);

  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your gallery to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const uploadData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      uploadData.append('image', { uri, name: filename, type } as any);

      const response = await fetch(`${Config.BASE_URL.replace('/api', '')}/api/upload`, {
        method: 'POST',
        body: uploadData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (data.image) {
        setFormData(prev => ({ ...prev, image: data.image }));
        Alert.alert('Success', 'Image uploaded successfully');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchTherapies();
  }, []);

  const fetchTherapies = async () => {
    try {
      const [therapyRes, bookingRes] = await Promise.all([
        api.get('/wellness/therapies'),
        api.get('/wellness/my-bookings')
      ]);
      setTherapies(therapyRes.data);
      setBookings(bookingRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.durationMinutes) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTherapy) {
        await api.put(`/wellness/therapies/${editingTherapy._id}`, formData);
        Alert.alert('Success', 'Therapy updated successfully');
      } else {
        await api.post('/wellness/therapies', formData);
        Alert.alert('Success', 'Therapy created successfully');
      }
      setModalVisible(false);
      fetchTherapies();
      resetForm();
    } catch (error) {
      console.error('Error saving therapy:', error);
      Alert.alert('Error', 'Failed to save therapy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Therapy',
      'Are you sure you want to remove this therapy service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/wellness/therapies/${id}`);
              fetchTherapies();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete therapy');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      durationMinutes: '',
      price: '',
      category: 'General',
      image: '',
      careInstructions: ''
    });
    setEditingTherapy(null);
  };

  const openEdit = (therapy: Therapy) => {
    setEditingTherapy(therapy);
    setFormData({
      name: therapy.name,
      description: therapy.description,
      durationMinutes: therapy.durationMinutes.toString(),
      price: therapy.price.toString(),
      category: therapy.category || 'General',
      image: therapy.image || '',
      careInstructions: therapy.careInstructions || ''
    });
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Therapies</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <PlusCircle size={24} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'services' && styles.tabBtnTextActive]}>My Services ({therapies.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bookings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bookings' && styles.tabBtnTextActive]}>Bookings ({bookings.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#f43f5e" style={{ marginTop: 50 }} />
        ) : activeTab === 'services' ? (
          therapies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Heart size={80} color="#e2e8f0" />
              <Text style={styles.emptyTitle}>No Therapies Listed</Text>
              <Text style={styles.emptyDesc}>Create your first wellness therapy service to start receiving bookings.</Text>
            </View>
          ) : (
            therapies.map(therapy => (
              <View key={therapy._id} style={styles.therapyCard}>
                <View style={styles.therapyThumb}>
                  {therapy.image ? (
                    <Image
                      source={{ uri: therapy.image.startsWith('/uploads') ? `${Config.BASE_URL.replace('/api', '')}${therapy.image}` : therapy.image }}
                      style={styles.thumbImage}
                    />
                  ) : (
                    <Heart size={20} color="#fecaca" />
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.therapyName}>{therapy.name}</Text>
                  <Text style={styles.therapyCategory}>{therapy.category}</Text>
                  <View style={styles.detailsRow}>
                    <View style={styles.detail}>
                      <Clock size={14} color="#94a3b8" />
                      <Text style={styles.detailText}>{therapy.durationMinutes} mins</Text>
                    </View>
                    <View style={styles.detail}>
                      <Tag size={14} color="#94a3b8" />
                      <Text style={[styles.detailText, { color: '#059669', fontWeight: '800' }]}>LKR {therapy.price}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(therapy)}>
                    <Edit2 size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(therapy._id)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Heart size={80} color="#e2e8f0" />
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyDesc}>Patient bookings for your therapies will appear here.</Text>
            </View>
          ) : (
            bookings.map(b => {
              const statusColors: any = {
                pending: { bg: '#fffbeb', text: '#d97706' },
                confirmed: { bg: '#eff6ff', text: '#3b82f6' },
                completed: { bg: '#ecfdf5', text: '#059669' },
                cancelled: { bg: '#fee2e2', text: '#ef4444' },
              };
              const sc = statusColors[b.status as string] || statusColors.pending;
              return (
                <View key={b._id} style={styles.therapyCard}>
                  <View style={[styles.therapyThumb, { backgroundColor: '#fff1f2' }]}>
                    <Heart size={20} color="#f43f5e" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.therapyName}>{b.therapy?.name || 'Therapy'}</Text>
                    <Text style={styles.therapyCategory}>{b.patient?.name || 'Patient'}</Text>
                    <View style={styles.detailsRow}>
                      <View style={styles.detail}>
                        <Clock size={14} color="#94a3b8" />
                        <Text style={styles.detailText}>{b.time}</Text>
                      </View>
                      <Text style={styles.detailText}>{new Date(b.date).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: sc.bg }]}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: sc.text }}>{b.status.toUpperCase()}</Text>
                  </View>
                </View>
              );
            })
          )
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingTherapy ? 'Edit Therapy' : 'Add New Therapy'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage} disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator color="#f43f5e" />
                  ) : formData.image ? (
                    <Image
                      source={{ uri: formData.image.startsWith('/uploads') ? `${Config.BASE_URL.replace('/api', '')}${formData.image}` : formData.image }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <>
                      <Plus size={24} color="#94a3b8" />
                      <Text style={styles.uploadText}>Upload Service Image</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Service Name*</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Abhyanga Massage"
                    placeholderTextColor="#94a3b8"
                    value={formData.name}
                    onChangeText={(val) => setFormData({ ...formData, name: val })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Detox, Relaxation, Skin Care"
                    placeholderTextColor="#94a3b8"
                    value={formData.category}
                    onChangeText={(val) => setFormData({ ...formData, category: val })}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Duration (Mins)*</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 60"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={formData.durationMinutes}
                      onChangeText={(val) => setFormData({ ...formData, durationMinutes: val })}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Price (LKR)*</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 3500"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={formData.price}
                      onChangeText={(val) => setFormData({ ...formData, price: val })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the benefits and procedure of this therapy..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    value={formData.description}
                    onChangeText={(val) => setFormData({ ...formData, description: val })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Post-Treatment Care Instructions</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g., Drink warm water, avoid direct sunlight for 2 hours, rest for 30 mins after therapy."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    value={formData.careInstructions}
                    onChangeText={(val) => setFormData({ ...formData, careInstructions: val })}
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={submitting}
                >
                  <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.saveGradient}>
                    {submitting ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Save size={20} color="#fff" />
                        <Text style={styles.saveText}>{editingTherapy ? 'Update Service' : 'Create Service'}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  addButton: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  therapyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center'
  },
  cardInfo: { flex: 1 },
  therapyName: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  therapyCategory: { fontSize: 11, fontWeight: '700', color: '#f43f5e', textTransform: 'uppercase', marginTop: 2, marginBottom: 8 },
  detailsRow: { flexDirection: 'row', gap: 15 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  therapyThumb: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#fff1f2', marginRight: 15, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1f2937', marginTop: 20 },
  emptyDesc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 10, paddingHorizontal: 40, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1f2937' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, fontSize: 15, fontWeight: '600', color: '#1f2937', borderWidth: 1, borderColor: '#f1f5f9' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveButton: { marginTop: 10, marginBottom: 20 },
  saveGradient: { height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  imageUploadBox: { width: '100%', height: 180, borderRadius: 24, backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 25, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadText: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginTop: 10 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabBtn: {
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  tabBtnActive: {
    backgroundColor: '#fff1f2',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#f43f5e',
  },
});
