import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag,
  CheckCircle2,
  X,
  MapPin,
  Phone,
  Truck
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import Config from '../constants/Config';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shippingData, setShippingData] = useState({
    shippingAddress: '',
    city: '',
    postalCode: '',
    phoneNumber: ''
  });

  const handlePlaceOrder = async () => {
    if (!shippingData.shippingAddress || !shippingData.city || !shippingData.postalCode || !shippingData.phoneNumber) {
      Alert.alert('Error', 'Please fill in all delivery details including Postal Code');
      return;
    }

    try {
      setLoading(true);
      
      // Group items by supplier because our backend Order model usually expects a single supplier per order
      // For now, if there are multiple suppliers, we might need multiple orders, 
      // but let's assume one supplier for simplicity or use the first one.
      const supplierId = cart[0]?.supplier?._id || cart[0]?.supplier;

      await api.post('/orders', {
        supplier: supplierId,
        items: cart.map(item => ({
          inventoryItem: item._id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.pricePerUnit
        })),
        totalAmount: getCartTotal(),
        ...shippingData,
        paymentMethod: 'Cash on Delivery'
      });
      
      setSuccess(true);
      clearCart();
      setTimeout(() => {
        setSuccess(false);
        setShowCheckout(false);
        router.push('/(tabs)/shop');
      }, 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <ShoppingBag size={60} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyDesc}>Add some fresh herbs to your cart and they will appear here.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/shop')}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity onPress={() => clearCart()} style={styles.clearBtn}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cart.map((item) => (
          <View key={item._id} style={styles.cartItem}>
            <View style={styles.itemImageContainer}>
              {item.image ? (
                <Image 
                  source={{ uri: item.image.startsWith('/uploads') ? `${Config.BASE_URL.replace('/api', '')}${item.image}` : item.image }} 
                  style={styles.itemImage} 
                />
              ) : (
                <Leaf size={30} color="#e2e8f0" />
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>LKR {item.pricePerUnit}</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => updateQuantity(item._id, item.quantity - 1)}
                >
                  <Minus size={16} color="#64748b" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => updateQuantity(item._id, item.quantity + 1)}
                >
                  <Plus size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item._id)} style={styles.removeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>LKR {getCartTotal()}</Text>
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>FREE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>LKR {getCartTotal()}</Text>
            </View>
        </View>

        <View style={styles.infoBox}>
            <Truck size={20} color="#10b981" />
            <Text style={styles.infoText}>Free delivery on all Ayurvedic products</Text>
        </View>
      </ScrollView>

      {/* Checkout Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalCol}>
            <Text style={styles.totalPriceLabel}>Total Amount</Text>
            <Text style={styles.totalPriceValue}>LKR {getCartTotal()}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowCheckout(true)}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Checkout Modal */}
      <Modal visible={showCheckout} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Delivery Details</Text>
                  <TouchableOpacity onPress={() => setShowCheckout(false)}><X size={24} color="#1f2937" /></TouchableOpacity>
                </View>
                {success ? (
                  <View style={styles.successContainer}>
                    <CheckCircle2 size={80} color="#10b981" />
                    <Text style={styles.successTitle}>Order Successful!</Text>
                    <Text style={styles.successDesc}>Thank you for choosing AyurLife.</Text>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Full Address</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Street, House No, etc."
                        multiline
                        numberOfLines={3}
                        value={shippingData.shippingAddress}
                        onChangeText={(val) => setShippingData({...shippingData, shippingAddress: val})}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>City</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter City"
                        value={shippingData.city}
                        onChangeText={(val) => setShippingData({...shippingData, city: val})}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Postal Code</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Postal Code"
                        keyboardType="number-pad"
                        value={shippingData.postalCode}
                        onChangeText={(val) => setShippingData({...shippingData, postalCode: val})}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="07X XXXXXXX"
                        keyboardType="phone-pad"
                        value={shippingData.phoneNumber}
                        onChangeText={(val) => setShippingData({...shippingData, phoneNumber: val})}
                      />
                    </View>
    
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                            <Text style={styles.paymentDesc}>Pay when you receive your herbs</Text>
                        </View>
                        <CheckCircle2 size={24} color="#10b981" />
                    </View>
    
                    <TouchableOpacity 
                        style={styles.confirmBtn} 
                        onPress={handlePlaceOrder}
                        disabled={loading}
                    >
                      <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Place Order (LKR {getCartTotal()})</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  clearBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9' },
  itemImageContainer: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#10b981', marginTop: 2 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: '900', color: '#1f2937' },
  removeBtn: { padding: 5 },
  summarySection: { backgroundColor: '#f8fafc', padding: 25, borderRadius: 30, marginTop: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  summaryTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryLabel: { color: '#64748b', fontWeight: '600' },
  summaryValue: { color: '#1f2937', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },
  totalLabel: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#10b981' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', padding: 15, borderRadius: 16, marginTop: 20 },
  infoText: { color: '#059669', fontSize: 13, fontWeight: '700' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 25, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 20 },
  totalCol: { flex: 1 },
  totalPriceLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  totalPriceValue: { fontSize: 20, fontWeight: '900', color: '#10b981' },
  checkoutBtn: { flex: 1.5, height: 60, borderRadius: 20, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937', marginBottom: 10 },
  emptyDesc: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  shopBtn: { height: 60, width: '100%', borderRadius: 20, overflow: 'hidden' },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: '#f1f5f9' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  paymentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#f0fdf4', borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#dcfce7' },
  paymentTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  paymentDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  confirmBtn: { height: 64, borderRadius: 24, overflow: 'hidden' },
  successContainer: { alignItems: 'center', paddingVertical: 40 },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#1f2937', marginTop: 25 },
  successDesc: { fontSize: 16, color: '#94a3b8', marginTop: 10 }
});
