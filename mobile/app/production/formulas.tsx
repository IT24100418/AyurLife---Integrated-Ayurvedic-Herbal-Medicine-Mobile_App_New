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
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  Plus, 
  ClipboardList, 
  FlaskConical, 
  Trash2, 
  Clock,
  PlusCircle,
  X
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';

export default function FormulasScreen() {
  const router = useRouter();
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // New Formula State
  const [newFormula, setNewFormula] = useState({
    name: '',
    type: 'Oil',
    ingredients: [{ name: '', quantity: '' }],
    method: '',
    productionTimeDays: ''
  });

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    try {
      const { data } = await api.get('/production/my-formulas');
      setFormulas(data);
    } catch (error) {
      console.error('Error fetching formulas:', error);
      Alert.alert('Error', 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    setNewFormula({
      ...newFormula,
      ingredients: [...newFormula.ingredients, { name: '', quantity: '' }]
    });
  };

  const handleRemoveIngredient = (index) => {
    const updated = newFormula.ingredients.filter((_, i) => i !== index);
    setNewFormula({ ...newFormula, ingredients: updated });
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...newFormula.ingredients];
    updated[index][field] = value;
    setNewFormula({ ...newFormula, ingredients: updated });
  };

  const handleSaveFormula = async () => {
    if (!newFormula.name || !newFormula.method || !newFormula.productionTimeDays) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/production/formulas', newFormula);
      Alert.alert('Success', 'Recipe saved successfully');
      setShowAddModal(false);
      setNewFormula({
        name: '',
        type: 'Oil',
        ingredients: [{ name: '', quantity: '' }],
        method: '',
        productionTimeDays: ''
      });
      fetchFormulas();
    } catch (error) {
      console.error('Error saving formula:', error);
      Alert.alert('Error', 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFormula = (id) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this traditional recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/production/formulas/${id}`);
              fetchFormulas();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  if (loading && formulas.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
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
        <Text style={styles.headerTitle}>Traditional Recipes</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtnHeader}>
          <Plus size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionSubtitle}>Manage your Ayurvedic formulations</Text>
        
        {formulas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FlaskConical size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No recipes saved yet</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.createBtnText}>Add First Recipe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          formulas.map((formula) => (
            <View key={formula._id} style={styles.formulaCard}>
              <View style={styles.formulaHeader}>
                <View style={[styles.typeBadge, { backgroundColor: '#f5f3ff' }]}>
                    <Text style={styles.typeText}>{formula.type}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteFormula(formula._id)}>
                    <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedFormula(formula);
                  setShowDetailModal(true);
                }}
              >
                <Text style={styles.formulaName}>{formula.name}</Text>
                
                <View style={styles.infoRow}>
                  <Clock size={14} color="#94a3b8" />
                  <Text style={styles.infoText}>{formula.productionTimeDays} Days Production Time</Text>
                </View>

                <View style={styles.ingredientsSummary}>
                  <Text style={styles.ingTitle}>Ingredients ({formula.ingredients?.length})</Text>
                  <Text style={styles.ingList} numberOfLines={1}>
                    {formula.ingredients?.map(ing => ing.name).join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.startBatchBtn}
                onPress={() => router.push({
                    pathname: '/production/batches',
                    params: { formulaId: formula._id, formulaName: formula.name }
                })}
              >
                <Text style={styles.startBatchText}>Start New Batch</Text>
                <Plus size={16} color="#8b5cf6" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Formula Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Formulation</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color="#1f2937" /></TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.inputLabel}>Recipe Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dashamularishta"
                value={newFormula.name}
                onChangeText={(val) => setNewFormula({ ...newFormula, name: val })}
              />

              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeContainer}>
                {['Oil', 'Arishta', 'Powder', 'Pill', 'Paste'].map((t) => (
                  <TouchableOpacity 
                    key={t} 
                    style={[styles.typeOption, newFormula.type === t && styles.activeType]}
                    onPress={() => setNewFormula({ ...newFormula, type: t })}
                  >
                    <Text style={[styles.typeOptionText, newFormula.type === t && styles.activeTypeText]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.inputLabel}>Ingredients</Text>
                <TouchableOpacity onPress={handleAddIngredient}><PlusCircle size={20} color="#8b5cf6" /></TouchableOpacity>
              </View>
              
              {newFormula.ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 2, marginBottom: 0 }]}
                    placeholder="Ingredient Name"
                    value={ing.name}
                    onChangeText={(val) => handleIngredientChange(idx, 'name', val)}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Qty"
                    value={ing.quantity}
                    onChangeText={(val) => handleIngredientChange(idx, 'quantity', val)}
                  />
                  {newFormula.ingredients.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveIngredient(idx)}>
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <Text style={styles.inputLabel}>Production Time (Days)</Text>
              <TextInput
                style={styles.input}
                placeholder="Days"
                keyboardType="numeric"
                value={newFormula.productionTimeDays}
                onChangeText={(val) => setNewFormula({ ...newFormula, productionTimeDays: val })}
              />

              <Text style={styles.inputLabel}>Method (Traditional Process)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the production process..."
                multiline
                numberOfLines={4}
                value={newFormula.method}
                onChangeText={(val) => setNewFormula({ ...newFormula, method: val })}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFormula} disabled={loading}>
                <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Recipe</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Recipe Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.detailLabel}>{selectedFormula?.type}</Text>
                <Text style={styles.modalTitle}>{selectedFormula?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}><X size={24} color="#1f2937" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Traditional Ingredients</Text>
                <View style={styles.ingGrid}>
                  {selectedFormula?.ingredients.map((ing, i) => (
                    <View key={i} style={styles.detailIngItem}>
                      <View style={styles.dot} />
                      <Text style={styles.detailIngName}>{ing.name}</Text>
                      <Text style={styles.detailIngQty}>{ing.quantity}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Preparation Method</Text>
                <View style={styles.methodCard}>
                  <Text style={styles.methodText}>{selectedFormula?.method}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.timeInfo}>
                  <Clock size={16} color="#8b5cf6" />
                  <Text style={styles.timeInfoText}>Estimated Production Time: {selectedFormula?.productionTimeDays} Days</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.startBatchBtnModal}
                onPress={() => {
                  setShowDetailModal(false);
                  router.push({
                    pathname: '/production/batches',
                    params: { formulaId: selectedFormula._id, formulaName: selectedFormula.name }
                  });
                }}
              >
                <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
                  <Text style={styles.startBatchBtnTextModal}>Start Production Batch</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
  createBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15, backgroundColor: '#8b5cf6' },
  createBtnText: { color: '#fff', fontWeight: '800' },
  formulaCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  formulaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  typeText: { fontSize: 10, fontWeight: '900', color: '#8b5cf6', textTransform: 'uppercase' },
  formulaName: { fontSize: 20, fontWeight: '900', color: '#1f2937', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  infoText: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },
  ingredientsSummary: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, marginBottom: 20 },
  ingTitle: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 5 },
  ingList: { fontSize: 13, color: '#1f2937', fontWeight: '600' },
  startBatchBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  startBatchText: { color: '#8b5cf6', fontSize: 14, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  inputLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeOption: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9' },
  activeType: { backgroundColor: '#8b5cf6' },
  typeOptionText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  activeTypeText: { color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ingInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveBtn: { marginTop: 20, height: 60, borderRadius: 20, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  detailLabel: { fontSize: 10, fontWeight: '900', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 1 },
  detailSection: { marginBottom: 25 },
  detailSectionTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginBottom: 15 },
  ingGrid: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20 },
  detailIngItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b5cf6', marginRight: 10 },
  detailIngName: { flex: 1, fontSize: 14, color: '#4b5563', fontWeight: '600' },
  detailIngQty: { fontSize: 14, color: '#1f2937', fontWeight: '800' },
  methodCard: { backgroundColor: '#fff', borderLeftWidth: 4, borderLeftColor: '#8b5cf6', padding: 15, borderRadius: 12, backgroundColor: '#f5f3ff' },
  methodText: { fontSize: 14, color: '#4b5563', lineHeight: 22, fontWeight: '500' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12 },
  timeInfoText: { fontSize: 13, color: '#1f2937', fontWeight: '700' },
  startBatchBtnModal: { height: 60, borderRadius: 20, overflow: 'hidden', marginTop: 10, marginBottom: 20 },
  startBatchBtnTextModal: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
