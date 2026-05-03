import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft,
  FileText,
  User as UserIcon,
  Calendar,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../../services/api';

export default function ViewPrescriptionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      const { data } = await api.get(`/prescriptions/${id}`);
      setPrescription(data);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      Alert.alert('Error', 'Failed to load prescription details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #10b981; }
              .title { font-size: 28px; font-weight: bold; color: #10b981; margin: 0; }
              .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
              .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .info-box { width: 45%; }
              .label { font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
              .value { font-size: 16px; font-weight: bold; color: #1f2937; margin: 0; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
              .table th { background-color: #f8fafc; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; }
              .table td { font-size: 14px; color: #334155; }
              .instructions { background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
              .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">AyurLife Clinic</h1>
              <p class="subtitle">Official Medical Prescription</p>
            </div>
            
            <div class="info-section">
              <div class="info-box">
                <p class="label">Patient Name</p>
                <p class="value">${prescription.patient?.name || 'Patient'}</p>
              </div>
              <div class="info-box" style="text-align: right;">
                <p class="label">Doctor Name</p>
                <p class="value">Dr. ${prescription.doctor?.name || 'Doctor'}</p>
                <p class="label" style="margin-top: 10px;">Date</p>
                <p class="value">${new Date(prescription.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <p class="label" style="font-size: 14px; margin-bottom: 10px; color: #1f2937;">Prescribed Medicines</p>
            <table class="table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Type</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${prescription.medicines.map(med => `
                  <tr>
                    <td style="font-weight: bold;">${med.name}</td>
                    <td>${med.type}</td>
                    <td>${med.dosage}</td>
                    <td>${med.frequency}</td>
                    <td>${med.days} Days</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${prescription.instructions ? `
              <p class="label" style="font-size: 14px; margin-bottom: 10px; color: #1f2937;">General Advice & Instructions</p>
              <div class="instructions">
                <p style="margin: 0;">${prescription.instructions.replace(/\n/g, '<br/>')}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p>This is a digitally generated prescription. Signature is not required.</p>
              <p>AyurLife Clinic & Wellness Center</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Prescription',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Error', 'Sharing/Saving is not available on this device');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Could not generate PDF');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#64748b' }}>Prescription not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription Details</Text>
        <TouchableOpacity onPress={generatePDF} style={styles.downloadBtn}>
          <FileText size={20} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Doctor Info Card */}
        <LinearGradient colors={['#10b981', '#059669']} style={styles.doctorCard}>
          <View style={styles.dInfoRow}>
            <View style={styles.avatar}>
              <UserIcon size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dName}>Dr. {prescription.doctor?.name || 'Ayurvedic Doctor'}</Text>
              <View style={styles.dDateRow}>
                <Calendar size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.dSub}>{new Date(prescription.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
        </View>

        {prescription.medicines?.map((med, index) => (
          <View key={index} style={styles.medCard}>
            <View style={styles.medHeaderRow}>
              <View style={styles.medIconBox}>
                <Pill size={20} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medType}>{med.type}</Text>
              </View>
              <View style={styles.medDaysBadge}>
                <Text style={styles.medDaysText}>{med.days} Days</Text>
              </View>
            </View>

            <View style={styles.medDetailsRow}>
              <View style={styles.medDetailBox}>
                <Text style={styles.medDetailLabel}>Dosage</Text>
                <Text style={styles.medDetailValue}>{med.dosage}</Text>
              </View>
              <View style={styles.medDetailBox}>
                <Text style={styles.medDetailLabel}>Frequency</Text>
                <Text style={styles.medDetailValue}>{med.frequency}</Text>
              </View>
            </View>
          </View>
        ))}

        {prescription.instructions ? (
          <View style={styles.instructionGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>General Advice & Instructions</Text>
            </View>
            <View style={styles.instructionBox}>
              <AlertCircle size={20} color="#f59e0b" style={{ marginTop: 2 }} />
              <Text style={styles.instructionText}>{prescription.instructions}</Text>
            </View>
          </View>
        ) : null}

      </ScrollView>
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
  downloadBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1f2937',
  },
  scrollContent: { padding: 25, paddingBottom: 50 },
  doctorCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 25,
  },
  dInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
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
  dName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  dDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  dSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  sectionHeader: { 
    marginBottom: 15 
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  medCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#f1f5f9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
  },
  medHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  medIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
  },
  medType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  medDaysBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  medDaysText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  medDetailsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  medDetailBox: {
    flex: 1,
  },
  medDetailLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  medDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  instructionGroup: { marginTop: 10, marginBottom: 25 },
  instructionBox: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    lineHeight: 22,
  }
});
