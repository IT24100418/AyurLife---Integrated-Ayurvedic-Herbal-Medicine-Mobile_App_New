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
  ChevronLeft, 
  Sparkles, 
  ShieldCheck, 
  Save,
  BookOpen,
  Award
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProducerHeritageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    heritageStory: '',
    experienceYears: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // We get fresh data from server
        const { data } = await api.get(`/production/profile/${user._id}`);
        setProfile({
          heritageStory: data.heritageStory || '',
          experienceYears: data.experienceYears ? data.experienceYears.toString() : ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.heritageStory) {
      Alert.alert('Required', 'Please share your heritage story');
      return;
    }

    try {
      setSaving(true);
      await api.put('/production/profile', {
        heritageStory: profile.heritageStory,
        experienceYears: Number(profile.experienceYears)
      });
      Alert.alert('Success', 'Your heritage profile has been updated!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <Text style={styles.headerTitle}>Heritage Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.cardGradient}>
              <Sparkles size={32} color="#fff" />
              <Text style={styles.cardTitle}>Share Your Heritage</Text>
              <Text style={styles.cardDesc}>
                Tell your story to build trust with patients. Your family history and experience make your medicine unique.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <BookOpen size={18} color="#8b5cf6" />
              <Text style={styles.inputLabel}>Heritage & Family Story</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your family heritage, the lineage of your practice, and how you prepare traditional medicine..."
              multiline
              numberOfLines={6}
              value={profile.heritageStory}
              onChangeText={(val) => setProfile({ ...profile, heritageStory: val })}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Award size={18} color="#8b5cf6" />
              <Text style={styles.inputLabel}>Years of Experience</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15"
              keyboardType="numeric"
              value={profile.experienceYears}
              onChangeText={(val) => setProfile({ ...profile, experienceYears: val })}
            />
          </View>

          <View style={styles.verifySection}>
            <ShieldCheck size={20} color="#10b981" />
            <Text style={styles.verifyText}>Your profile helps verify the authenticity of your traditional products.</Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>Update Heritage Profile</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  scrollContent: { padding: 25 },
  infoCard: { borderRadius: 30, overflow: 'hidden', marginBottom: 30, elevation: 5, shadowColor: '#8b5cf6', shadowOpacity: 0.2, shadowRadius: 15 },
  cardGradient: { padding: 30 },
  cardTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 15 },
  cardDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8, lineHeight: 20, fontWeight: '500' },
  inputGroup: { marginBottom: 25 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#1f2937' },
  input: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, fontSize: 15, fontWeight: '600', color: '#1f2937', borderWidth: 1, borderColor: '#f1f5f9' },
  textArea: { minHeight: 150, textAlignVertical: 'top' },
  verifySection: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0fdf4', padding: 20, borderRadius: 20, marginBottom: 30 },
  verifyText: { flex: 1, fontSize: 13, color: '#059669', fontWeight: '700', lineHeight: 18 },
  saveBtn: { height: 64, borderRadius: 24, overflow: 'hidden', marginBottom: 40 },
  btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
