import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShoppingBag, Truck, Package, Clock, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import Config from '../../constants/Config';

export default function ProductionOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/supplier');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching production orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchOrders();
      Alert.alert('Success', `Order marked as ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#10b981';
      case 'shipped': return '#3b82f6';
      default: return '#8b5cf6';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Orders</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 50 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyDesc}>Orders for your processed medicines will appear here.</Text>
          </View>
        ) : (
          orders.map(order => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.buyerInfo}>
                <Text style={styles.buyerLabel}>Customer</Text>
                <Text style={styles.buyerName}>{order.buyer?.name || 'AyurLife User'}</Text>
                <Text style={styles.buyerAddress}>{order.shippingAddress}, {order.city}</Text>
              </View>

              <View style={styles.itemsList}>
                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemThumb}>
                      {item.image ? (
                        <Image 
                          source={{ uri: item.image.startsWith('/uploads') ? `${Config.BASE_URL.replace('/api', '')}${item.image}` : item.image }} 
                          style={styles.thumbImage} 
                        />
                      ) : <Package size={20} color="#cbd5e1" />}
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>LKR {item.price * item.quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <View>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>LKR {order.totalAmount}</Text>
                </View>
                
                {order.status === 'pending' && (
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleUpdateStatus(order._id, 'shipped')}
                  >
                    <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.actionGradient}>
                      <Truck size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Ship Order</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {order.status === 'shipped' && (
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleUpdateStatus(order._id, 'delivered')}
                  >
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.actionGradient}>
                      <CheckCircle2 size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Deliver</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1f2937' },
  scrollContent: { padding: 20 },
  orderCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  orderId: { fontSize: 16, fontWeight: '900', color: '#1f2937' },
  orderDate: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '900' },
  buyerInfo: { padding: 15, backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 20 },
  buyerLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 5 },
  buyerName: { fontSize: 15, fontWeight: '800', color: '#1f2937' },
  buyerAddress: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
  itemsList: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15, marginBottom: 15 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemThumb: { width: 45, height: 45, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  itemQty: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#10b981' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  actionBtn: { borderRadius: 16, overflow: 'hidden' },
  actionGradient: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#1f2937', marginTop: 20 },
  emptyDesc: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },
});
