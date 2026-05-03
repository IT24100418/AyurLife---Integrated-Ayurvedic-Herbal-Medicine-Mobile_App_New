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
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Trash2, 
  Stethoscope, 
  CheckCircle2, 
  ChevronLeft,
  Info,
  Pill,
  Clock,
  Calendar,
  Activity,
  AlertCircle
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';

export default function CreatePrescriptionScreen() {
  const { id: appointmentId } = useLocalSearchParams();
  const router = useRouter();
  
  const [appointment, setAppointment] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [medicines, setMedicines] = useState([
    { name: '', type: 'Arishta', dosage: '2 tbsp', frequency: 'After Meals', days: '7' }
  ]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const { data: allAppts } = await api.get('/appointments/doctor');
      const appt = allAppts.find(a => a._id === appointmentId);
      if (appt) {
        setAppointment(appt);
        // Fetch patient profile for symptoms and prakruthi
        // Note: We need the patient's USER ID, but appt.patient might be populated or ID
        const patientId = appt.patient?._id || appt.patient;
        const { data: profile } = await api.get(`/doctors/patients/${patientId}`).catch(() => ({ data: null }));
        setPatientProfile(profile);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', type: 'Pill', dosage: '', frequency: 'Morning/Night', days: '7' }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    const hasEmptyMed = medicines.some(m => !m.name || !m.dosage || !m.frequency);
    if (hasEmptyMed) {
      Alert.alert('Error', 'Please fill in all medicine details');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/prescriptions', {
        appointmentId,
        medicines,
        instructions
      });
      Alert.alert('Success', 'Prescription issued successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error('Error issuing prescription:', error);
      Alert.alert('Error', 'Failed to issue prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Prescription</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Patient Info Card */}
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.patientCard}>
            <View style={styles.pInfoRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{appointment?.patient?.name?.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pName}>{appointment?.patient?.name}</Text>
                <Text style={styles.pSub}>Reason: {appointment?.reason}</Text>
              </View>
              <TouchableOpacity 
                style={styles.summaryToggle}
                onPress={() => setShowHistory(!showHistory)}
              >
                <Activity size={20} color="#fff" />
                <Text style={styles.summaryToggleText}>View Logs</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Clinical Summary Panel */}
          {showHistory && (
            <View style={styles.summaryPanel}>
                <View style={[styles.sectionHeader, { marginTop: 0 }]}>
                    <Activity size={18} color="#2563eb" />
                    <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Patient Clinical Summary</Text>
                </View>
                
                <View style={styles.prakruthiBrief}>
                    <Text style={styles.pLabel}>Prakruthi:</Text>
                    <View style={styles.pBadge}>
                        <Text style={styles.pBadgeText}>{patientProfile?.prakruthi || 'Unknown'}</Text>
                    </View>
                </View>

                <Text style={styles.historyLabel}>Latest Symptoms:</Text>
                {patientProfile?.symptoms?.length > 0 ? (
                    patientProfile.symptoms.slice(-3).reverse().map((s, idx) => (
                        <View key={idx} style={styles.summarySymptom}>
                            <View style={styles.symDot} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.symName}>{s.symptomName} ({s.severity})</Text>
                                <Text style={styles.symDate}>{new Date(s.date).toLocaleDateString()} • {s.duration}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noLogs}>No symptoms logged recently.</Text>
                )}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medications</Text>
            <TouchableOpacity style={styles.addMedBtn} onPress={addMedicine}>
              <Plus size={16} color="#3b82f6" />
              <Text style={styles.addMedText}>Add Medicine</Text>
            </TouchableOpacity>
          </View>

          {medicines.map((med, index) => (
            <View key={index} style={styles.medCard}>
              <View style={styles.medCardHeader}>
                <View style={styles.medNumBox}>
                  <Text style={styles.medNumText}>#{index + 1}</Text>
                </View>
                {medicines.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedicine(index)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Medicine Name</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Sudarshana"
                    value={med.name}
                    onChangeText={val => handleMedicineChange(index, 'name', val)}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Type</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Pill/Liquid"
                    value={med.type}
                    onChangeText={val => handleMedicineChange(index, 'type', val)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Dosage</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="2 tabs"
                    value={med.dosage}
                    onChangeText={val => handleMedicineChange(index, 'dosage', val)}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Frequency</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="M/N"
                    value={med.frequency}
                    onChangeText={val => handleMedicineChange(index, 'frequency', val)}
                  />
                </View>
                <View style={{ flex: 0.8, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Days</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="7"
                    keyboardType="numeric"
                    value={med.days}
                    onChangeText={val => handleMedicineChange(index, 'days', val)}
                  />
                </View>
              </View>
            </View>
          ))}

          <View style={styles.instructionGroup}>
            <Text style={styles.sectionTitle}>General advice</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Lifestyle advice, diet, etc..."
              multiline
              numberOfLines={4}
              value={instructions}
              onChangeText={setInstructions}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.submitGradient}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Stethoscope size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Issue Prescription</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1f2937',
  },
  scrollContent: { padding: 25, paddingBottom: 50 },
  patientCard: {
    padding: 20,
    borderRadius: 30,
    marginBottom: 25,
  },
  pInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  pName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  pSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  addMedBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  addMedText: { color: '#2563eb', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  medCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  medCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  medNumBox: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  medNumText: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
  inputLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 5 },
  inputRow: { flexDirection: 'row', marginBottom: 15 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  instructionGroup: { marginTop: 10, marginBottom: 25 },
  submitBtn: { marginTop: 10 },
  submitGradient: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  summaryToggle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryToggleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryPanel: {
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  prakruthiBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  pLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  pBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  historyLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  summarySymptom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  symDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginTop: 6,
  },
  symName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
  },
  symDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  noLogs: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  }
});
