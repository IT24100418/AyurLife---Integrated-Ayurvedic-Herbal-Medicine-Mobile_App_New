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
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft,
  ShoppingBag,
  User as UserIcon,
  MapPin,
  Phone,
  Truck,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  CreditCard
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import Config from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchOrder();
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
            const parsedUser = JSON.parse(stored);
            setUser(parsedUser);
            console.log('Frontend: User fetched:', parsedUser._id, parsedUser.role);
        }
    } catch (err) {
        console.error('Error fetching user info:', err);
    }
  };

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      console.log(`Frontend: Sending update status ${status} for order ${id}`);
      setUpdating(true);
      const { data } = await api.put(`/orders/${id}/status`, { status });
      console.log('Frontend: Update response data:', data);
      Alert.alert('Success', status === 'delivered' ? 'Delivery confirmed!' : `Order marked as ${status}`);
      fetchOrder();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (!order) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#f59e0b';
      case 'shipped': return '#3b82f6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: getStatusColor(order.status) + '15', borderColor: getStatusColor(order.status) }]}>
            <View style={styles.statusRow}>
                <Package size={24} color={getStatusColor(order.status)} />
                <View>
                    <Text style={[styles.statusLabel, { color: getStatusColor(order.status) }]}>Order Status</Text>
                    <Text style={[styles.statusValue, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
                </View>
            </View>
            <Text style={styles.orderId}>ID: {order._id}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <UserIcon size={18} color="#94a3b8" />
                    <View>
                        <Text style={styles.infoLabel}>Name</Text>
                        <Text style={styles.infoText}>{order.buyer?.name}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <MapPin size={18} color="#94a3b8" />
                    <View>
                        <Text style={styles.infoLabel}>Shipping Address</Text>
                        <Text style={styles.infoText}>{order.shippingAddress}, {order.city}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Phone size={18} color="#94a3b8" />
                    <View>
                        <Text style={styles.infoLabel}>Phone Number</Text>
                        <Text style={styles.infoText}>{order.phoneNumber}</Text>
                    </View>
                </View>
            </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {order.items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                    <View style={styles.itemIconBox}>
                        {item.image ? (
                            <Image 
                                source={{ uri: item.image.startsWith('/uploads') ? `${Config.BASE_URL.replace('/api', '')}${item.image}` : item.image }} 
                                style={styles.itemImage} 
                            />
                        ) : (
                            <ShoppingBag size={20} color="#f59e0b" />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQty}>Quantity: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>LKR {item.price * item.quantity}</Text>
                </View>
            ))}
            
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>LKR {order.totalAmount}</Text>
            </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
            <View style={styles.paymentCard}>
                <CreditCard size={18} color="#64748b" />
                <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
            </View>
        </View>

        {/* Actions Section */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <View style={styles.actionSection}>
                {/* Supplier/Admin Controls */}
                {(user?.role === 'admin' || user?._id === order.supplier?._id || user?._id === order.supplier) && (
                    <>
                        {order.status === 'pending' && (
                            <TouchableOpacity 
                                style={styles.primaryBtn} 
                                onPress={() => handleUpdateStatus('shipped')}
                                disabled={updating}
                            >
                                <LinearGradient colors={['#f59e0b', '#ea580c']} style={styles.btnGradient}>
                                    {updating ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <Truck size={20} color="#fff" />
                                            <Text style={styles.btnText}>Mark as Shipped</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                            style={styles.secondaryBtn} 
                            onPress={() => handleUpdateStatus('cancelled')}
                            disabled={updating}
                        >
                            <XCircle size={18} color="#ef4444" />
                            <Text style={styles.secondaryBtnText}>Cancel Order</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* Buyer Controls */}
                {user?._id === (order.buyer?._id || order.buyer) && order.status === 'shipped' && (
                    <TouchableOpacity 
                        style={styles.primaryBtn} 
                        onPress={() => handleUpdateStatus('delivered')}
                        disabled={updating}
                    >
                        <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
                            {updating ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <CheckCircle2 size={20} color="#fff" />
                                    <Text style={styles.btnText}>Confirm Delivery</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        )}

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1f2937',
  },
  scrollContent: { padding: 25, paddingBottom: 50 },
  statusCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 25,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  statusLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  statusValue: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  orderId: { fontSize: 10, color: '#94a3b8', marginTop: 10, fontWeight: '600' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1f2937', marginBottom: 15 },
  infoCard: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  infoRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  infoLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  infoText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  itemIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1f2937' },
  itemQty: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '900', color: '#10b981' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  totalLabel: { fontSize: 16, fontWeight: '900', color: '#1f2937' },
  totalAmount: { fontSize: 20, fontWeight: '900', color: '#10b981' },
  paymentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, alignSelf: 'flex-start' },
  paymentMethod: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  actionSection: { gap: 10 },
  btnGradient: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  secondaryBtn: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#fee2e2' },
  secondaryBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' }
});
