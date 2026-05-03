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
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Activity, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  Thermometer,
  Zap,
  Wind,
  Droplets,
  Flame
} from 'lucide-react-native';
import api from '../services/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function SymptomsScreen() {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symptomName: '',
    severity: 'Mild',
    duration: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const severityOptions = ['Mild', 'Moderate', 'Severe'];

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    try {
      const { data } = await api.get('/patients/me');
      setSymptoms(data.symptoms || []);
    } catch (error) {
      console.error('Error fetching symptoms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.symptomName || !formData.duration) {
      Alert.alert('Error', 'Please fill in the symptom and duration');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/patients/symptoms', formData);
      setFormData({ symptomName: '', severity: 'Mild', duration: '', notes: '' });
      setShowForm(false);
      fetchSymptoms();
      Alert.alert('Success', 'Symptom logged successfully');
    } catch (error) {
      console.error('Error logging symptom:', error);
      Alert.alert('Error', 'Failed to log symptom');
    } finally {
      setSubmitting(false);
    }
  };

  const SymptomItem = ({ item }) => {
    const severityColors = {
      Mild: '#ecfdf5',
      Moderate: '#fffbeb',
      Severe: '#fef2f2'
    };
    const severityTextColors = {
      Mild: '#059669',
      Moderate: '#d97706',
      Severe: '#ef4444'
    };

    return (
      <View style={styles.symptomCard}>
        <View style={styles.symptomHeader}>
          <View style={styles.titleGroup}>
            <Text style={styles.symptomName}>{item.symptomName}</Text>
            <Text style={styles.symptomDate}>
              {new Date(item.date).toLocaleDateString()} • {item.duration}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: severityColors[item.severity] }]}>
            <Text style={[styles.severityText, { color: severityTextColors[item.severity] }]}>
              {item.severity}
            </Text>
          </View>
        </View>
        {item.notes && <Text style={styles.symptomNotes}>{item.notes}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Tracker</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          {showForm ? <ChevronRight size={24} color="#10b981" /> : <Plus size={24} color="#10b981" />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showForm ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Log New Symptom</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What are you feeling?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Headache, Joint Pain"
                value={formData.symptomName}
                onChangeText={(val) => setFormData({...formData, symptomName: val})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Severity</Text>
              <View style={styles.severityContainer}>
                {severityOptions.map(opt => (
                  <TouchableOpacity 
                    key={opt}
                    style={[styles.severityChip, formData.severity === opt && styles.activeSeverityChip]}
                    onPress={() => setFormData({...formData, severity: opt})}
                  >
                    <Text style={[styles.severityChipText, formData.severity === opt && styles.activeSeverityChipText]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2 days, Since morning"
                value={formData.duration}
                onChangeText={(val) => setFormData({...formData, duration: val})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific triggers or details?"
                multiline
                numberOfLines={3}
                value={formData.notes}
                onChangeText={(val) => setFormData({...formData, notes: val})}
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.submitGradient}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Activity size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Log Symptom</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Quick Insights */}
            <View style={styles.insightSection}>
              <LinearGradient colors={['#ecfdf5', '#f0fdf4']} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <AlertCircle size={20} color="#10b981" />
                  <Text style={styles.insightTitle}>Health Prediction</Text>
                </View>
                <Text style={styles.insightText}>
                  Based on your logs, we recommend increasing your Vata-balancing diet today.
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Recent History</Text>
              <Calendar size={18} color="#94a3b8" />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 50 }} />
            ) : symptoms.length > 0 ? (
              symptoms.map((item, idx) => <SymptomItem key={idx} item={item} />)
            ) : (
              <View style={styles.emptyContainer}>
                <Activity size={48} color="#e2e8f0" />
                <Text style={styles.emptyText}>No symptoms logged yet.</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => setShowForm(true)}>
                  <Text style={styles.emptyButtonText}>Log Your First Symptom</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Dosha Status */}
      {!showForm && (
        <View style={styles.doshaFooter}>
          <View style={styles.doshaItem}>
            <Wind size={20} color="#94a3b8" />
            <Text style={styles.doshaLabel}>VATA</Text>
          </View>
          <View style={styles.doshaItem}>
            <Flame size={20} color="#ef4444" />
            <Text style={styles.doshaLabel}>PITTA</Text>
          </View>
          <View style={styles.doshaItem}>
            <Droplets size={20} color="#3b82f6" />
            <Text style={styles.doshaLabel}>KAPHA</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1f2937',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  formContainer: {
    backgroundColor: '#fff',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 18,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  severityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activeSeverityChip: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  severityChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94a3b8',
  },
  activeSeverityChipText: {
    color: '#fff',
  },
  submitButton: {
    marginTop: 10,
  },
  submitGradient: {
    height: 65,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightSection: {
    marginBottom: 30,
  },
  insightCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
    lineHeight: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1f2937',
  },
  symptomCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleGroup: {
    flex: 1,
  },
  symptomName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1f2937',
  },
  symptomDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  symptomNotes: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    padding: 30,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10b981',
  },
  doshaFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 20,
    paddingBottom: 40,
    justifyContent: 'space-around',
  },
  doshaItem: {
    alignItems: 'center',
    gap: 5,
  },
  doshaLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1,
  }
});
