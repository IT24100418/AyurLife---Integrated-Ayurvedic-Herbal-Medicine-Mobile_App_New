import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  ShoppingBag, 
  Leaf, 
  CheckCircle2,
  X,
  Plus,
  Box,
  ShieldCheck,
  Tag,
  Star,
  Clock,
  FlaskConical,
  Award,
  MessageSquare,
  Send,
  Trash2
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import Config from '../../constants/Config';
import { useCart } from '../../context/CartContext';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shippingData, setShippingData] = useState({
    shippingAddress: '',
    city: '',
    postalCode: '',
    phoneNumber: ''
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [batchDetails, setBatchDetails] = useState(null);
  const [producerProfile, setProducerProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchCurrentUser();
    checkPurchase();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        setCurrentUser(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const checkPurchase = async () => {
    try {
        const { data } = await api.get(`/orders/check-purchase/${id}`);
        setHasPurchased(data.hasPurchased);
    } catch (error) {
        console.error('Error checking purchase status:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/inventory/${id}`);
      setProduct(data);
      
      // If product has a linked batch, fetch its journey
      if (data.batch) {
          const batchRes = await api.get(`/production/batches/${data.batch._id || data.batch}`);
          setBatchDetails(batchRes.data);
      }

      // Fetch Producer Profile
      if (data.supplier) {
          const supId = data.supplier._id || data.supplier;
          const profRes = await api.get(`/production/profile/${supId}`);
          setProducerProfile(profRes.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    console.log('Submitting review for product:', id);
    console.log('Review Form Data:', reviewForm);
    
    if (!reviewForm.comment) {
        Alert.alert('Error', 'Please enter a comment');
        return;
    }
    setSubmittingReview(true);
    try {
        const response = await api.post(`/inventory/${id}/reviews`, reviewForm);
        console.log('Review Response:', response.data);
        Alert.alert('Success', 'Review submitted successfully!');
        setShowReviewModal(false);
        setReviewForm({ rating: 5, comment: '' });
        fetchProduct();
    } catch (error) {
        console.error('Error submitting review:', error);
        console.log('Error Response:', error.response?.data);
        Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
    } finally {
        setSubmittingReview(false);
    }
  };

  const deleteReview = async (reviewId) => {
    Alert.alert(
        'Delete Review',
        'Are you sure you want to remove this review?',
        [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/inventory/${id}/reviews/${reviewId}`);
                        Alert.alert('Success', 'Review removed');
                        fetchProduct();
                    } catch (error) {
                        console.error('Error deleting review:', error);
                        Alert.alert('Error', 'Failed to delete review');
                    }
                }
            }
        ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProduct();
    setRefreshing(false);
  };

  const handlePlaceOrder = async () => {
    if (!shippingData.shippingAddress || !shippingData.city || !shippingData.postalCode || !shippingData.phoneNumber) {
      Alert.alert('Error', 'Please fill in all delivery details including Postal Code');
      return;
    }

    try {
      await api.post('/orders', {
        supplier: product.supplier?._id || product.supplier,
        items: [{
          inventoryItem: product._id,
          name: product.name,
          image: product.image,
          quantity: 1,
          price: product.pricePerUnit
        }],
        totalAmount: product.pricePerUnit,
        ...shippingData,
        paymentMethod: 'Cash on Delivery'
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowCheckout(false);
        router.push('/(tabs)/shop');
      }, 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!product) return null;

  const imageUri = product.image 
    ? (product.image.startsWith('/uploads') ? `${Config.BASE_URL.replace('/api', '')}${product.image}` : product.image)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {/* Product Image Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.mainImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Leaf size={100} color="#e2e8f0" />
            </View>
          )}
          
          <LinearGradient 
            colors={['transparent', 'rgba(0,0,0,0.6)']} 
            style={styles.imageOverlay}
          />
        </View>

        {/* Product Details Content */}
        <View style={styles.detailsContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category.toUpperCase()}</Text>
          </View>
          
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
                {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} color={s <= Math.floor(product.rating || 0) ? "#f59e0b" : "#e2e8f0"} fill={s <= Math.floor(product.rating || 0) ? "#f59e0b" : "transparent"} />
                ))}
                <Text style={styles.ratingText}>{product.rating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.reviewText}>({product.numReviews || 0} reviews)</Text>
            </View>
            <View style={styles.salesBadge}>
                <Text style={styles.salesText}>{product.salesCount || 0} Sold</Text>
            </View>
          </View>
          
          <Text style={styles.productName}>{product.name}</Text>
          {product.scientificName && (
            <Text style={styles.scientificName}>{product.scientificName}</Text>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>LKR {product.pricePerUnit}</Text>
            <View style={[styles.stockBadge, { backgroundColor: product.stock > 0 ? '#ecfdf5' : '#fef2f2' }]}>
                <Box size={14} color={product.stock > 0 ? '#10b981' : '#ef4444'} />
                <Text style={[styles.stockText, { color: product.stock > 0 ? '#059669' : '#ef4444' }]}>
                    {product.stock > 0 ? `${product.stock} ${product.unit} Available` : 'Out of Stock'}
                </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Description</Text>
            <Text style={styles.descriptionText}>
              {product.description || "No description available for this item. This is a pure and natural Ayurvedic product sourced from verified local suppliers."}
            </Text>
          </View>

          <View style={styles.featuresRow}>
              <View style={styles.feature}>
                  <ShieldCheck size={20} color="#10b981" />
                  <Text style={styles.featureText}>Quality Assured</Text>
              </View>
              <View style={styles.feature}>
                  <Clock size={20} color="#10b981" />
                  <Text style={styles.featureText}>{product.estimatedDelivery || '2-4 Days'}</Text>
              </View>
          </View>

          {batchDetails && (
              <View style={styles.journeySection}>
                  <View style={styles.journeyHeader}>
                      <FlaskConical size={20} color="#8b5cf6" />
                      <Text style={styles.journeyTitle}>Production Journey</Text>
                  </View>
                  
                  <View style={styles.journeyContent}>
                      <View style={styles.journeyStep}>
                          <View style={styles.stepDot} />
                          <View style={styles.stepLine} />
                          <View style={styles.stepInfo}>
                              <Text style={styles.stepTitle}>Traditional Formulation</Text>
                              <Text style={styles.stepDesc}>Recipe: {batchDetails.formulation?.name}</Text>
                          </View>
                      </View>

                      <View style={styles.journeyStep}>
                          <View style={[styles.stepDot, { backgroundColor: '#8b5cf6' }]} />
                          <View style={styles.stepLine} />
                          <View style={styles.stepInfo}>
                              <Text style={styles.stepTitle}>Batch Tracking (Active)</Text>
                              <Text style={styles.stepDesc}>Batch #{batchDetails.batchNumber}</Text>
                          </View>
                      </View>

                      {batchDetails.qualityLogs?.length > 0 && (
                          <View style={styles.journeyStep}>
                              <View style={[styles.stepDot, { backgroundColor: '#10b981' }]} />
                              <View style={styles.stepInfo}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Text style={styles.stepTitle}>Verified Quality Logs</Text>
                                      {batchDetails.labReport && (
                                          <View style={styles.verifiedTag}>
                                              <ShieldCheck size={10} color="#10b981" />
                                              <Text style={styles.verifiedTagText}>LAB VERIFIED</Text>
                                          </View>
                                      )}
                                  </View>
                                  {batchDetails.qualityLogs.map((log, idx) => (
                                      <Text key={idx} style={styles.logText}>• {log.note}</Text>
                                  ))}
                              </View>
                          </View>
                      )}
                  </View>
                  <View style={styles.verifiedBadge}>
                      <ShieldCheck size={14} color="#10b981" />
                      <Text style={styles.verifiedText}>Pure Ayurvedic Standard Verified</Text>
                  </View>
              </View>
          )}

          <View style={styles.supplierCard}>
              <View style={styles.supplierHeader}>
                  <View>
                      <Text style={styles.supplierLabel}>Produced By</Text>
                      <Text style={styles.supplierName}>{product.supplier?.name || 'Traditional Producer'}</Text>
                  </View>
                  {producerProfile?.experienceYears && (
                      <View style={styles.expBadge}>
                          <Award size={12} color="#8b5cf6" />
                          <Text style={styles.expText}>{producerProfile.experienceYears}Y Exp</Text>
                      </View>
                  )}
              </View>
              
              {producerProfile?.heritageStory && (
                  <View style={styles.heritageSection}>
                      <Text style={styles.heritageTitle}>Traditional Heritage</Text>
                      <Text style={styles.heritageStory} numberOfLines={4}>
                          {producerProfile.heritageStory}
                      </Text>
                  </View>
              )}
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewSection}>
              <View style={styles.reviewHeader}>
                  <View>
                      <Text style={styles.sectionTitle}>Reviews ({product.reviews?.length || 0})</Text>
                      <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={14} color={s <= product.rating ? '#f59e0b' : '#e2e8f0'} fill={s <= product.rating ? '#f59e0b' : 'transparent'} />
                          ))}
                          <Text style={styles.avgRating}>{product.rating?.toFixed(1)} Avg</Text>
                      </View>
                  </View>
                  {(hasPurchased || currentUser?.role === 'admin') && (
                      <TouchableOpacity style={styles.writeBtn} onPress={() => setShowReviewModal(true)}>
                          <Text style={styles.writeBtnText}>Write</Text>
                      </TouchableOpacity>
                  )}
              </View>

              {product.reviews?.length > 0 ? (
                  [...product.reviews].reverse().map((review, idx) => (
                      <View key={idx} style={styles.reviewCard}>
                          <View style={styles.reviewUserRow}>
                              <View style={styles.userInitial}>
                                  <Text style={styles.initialText}>{review.name?.charAt(0)}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                  <Text style={styles.revUserName}>{review.name}</Text>
                                  <View style={styles.revStars}>
                                      {[1, 2, 3, 4, 5].map((s) => (
                                          <Star key={s} size={10} color={s <= review.rating ? '#f59e0b' : '#e2e8f0'} fill={s <= review.rating ? '#f59e0b' : 'transparent'} />
                                      ))}
                                      <Text style={styles.revDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                  </View>
                              </View>
                              {currentUser?.role === 'admin' && (
                                  <TouchableOpacity 
                                    style={styles.deleteRevBtn} 
                                    onPress={() => deleteReview(review._id)}
                                  >
                                    <Trash2 size={16} color="#ef4444" />
                                  </TouchableOpacity>
                              )}
                          </View>
                          <Text style={styles.revComment}>{review.comment}</Text>
                      </View>
                  ))
              ) : (
                  <View style={styles.emptyReviews}>
                      <MessageSquare size={40} color="#e2e8f0" />
                      <Text style={styles.emptyRevText}>No reviews yet. Be the first!</Text>
                  </View>
              )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
            style={styles.cartBtn} 
            onPress={() => {
                addToCart(product);
                Alert.alert('Success', 'Added to cart!');
            }}
            disabled={product.stock <= 0}
        >
          <View style={styles.cartBtnOutline}>
            <ShoppingBag size={24} color="#10b981" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
            style={styles.buyBtn} 
            onPress={() => {
                addToCart(product);
                router.push('/cart');
            }}
            disabled={product.stock <= 0}
        >
          <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
            <ShoppingBag size={20} color="#fff" />
            <Text style={styles.btnText}>Buy Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <View style={styles.reviewModalContent}>
                  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      <View style={styles.modalHeader}>
                          <View>
                              <Text style={styles.modalTitle}>Rate Product</Text>
                              <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 12, marginTop: 2 }}>Share your experience with others</Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => setShowReviewModal(false)}
                            style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 12 }}
                          >
                            <X size={20} color="#64748b" />
                          </TouchableOpacity>
                      </View>
                      
                      <View style={{ backgroundColor: '#f0fdf4', padding: 20, borderRadius: 24, marginBottom: 25 }}>
                        <Text style={styles.ratingHint}>How would you rate this herb?</Text>
                        <View style={styles.ratingSelectRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <TouchableOpacity 
                                    key={s} 
                                    onPress={() => setReviewForm({ ...reviewForm, rating: s })}
                                    style={{ transform: [{ scale: s === reviewForm.rating ? 1.2 : 1 }] }}
                                >
                                    <Star 
                                        size={38} 
                                        color={s <= reviewForm.rating ? '#f59e0b' : '#cbd5e1'} 
                                        fill={s <= reviewForm.rating ? '#f59e0b' : 'transparent'} 
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Your Feedback</Text>
                          <TextInput 
                              style={[styles.input, styles.textArea, { backgroundColor: '#fff', borderColor: '#e2e8f0' }]}
                              placeholder="Tell others about your experience..."
                              placeholderTextColor="#94a3b8"
                              multiline
                              numberOfLines={4}
                              value={reviewForm.comment}
                              onChangeText={(val) => setReviewForm({ ...reviewForm, comment: val })}
                          />
                      </View>

                      <TouchableOpacity style={styles.submitRevBtn} onPress={submitReview} disabled={submittingReview}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
                              {submittingReview ? <ActivityIndicator color="#fff" /> : (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                      <Send size={18} color="#fff" />
                                      <Text style={styles.btnText}>Submit Review</Text>
                                  </View>
                              )}
                          </LinearGradient>
                      </TouchableOpacity>
                  </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={showCheckout} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -150}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Checkout</Text>
                  <TouchableOpacity onPress={() => setShowCheckout(false)}><X size={24} color="#1f2937" /></TouchableOpacity>
                </View>
                {success ? (
                  <View style={styles.successContainer}>
                    <CheckCircle2 size={80} color="#10b981" />
                    <Text style={styles.successTitle}>Order Placed!</Text>
                    <Text style={styles.successDesc}>Your herbs are on the way.</Text>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.summaryCard}>
                      <Text style={styles.sumName}>{product?.name}</Text>
                      <Text style={styles.sumPrice}>LKR {product?.pricePerUnit}</Text>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Delivery Address</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter full address"
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
                        placeholder="City"
                        value={shippingData.city}
                        onChangeText={(val) => setShippingData({...shippingData, city: val})}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Postal Code</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Postal Code"
                        keyboardType="numeric"
                        value={shippingData.postalCode}
                        onChangeText={(val) => setShippingData({...shippingData, postalCode: val})}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        keyboardType="phone-pad"
                        value={shippingData.phoneNumber}
                        onChangeText={(val) => setShippingData({...shippingData, phoneNumber: val})}
                        />
                    </View>
                    
                    <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder}>
                      <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
                        <Text style={styles.btnText}>Confirm Order</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageSection: { height: 350, position: 'relative' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '100%', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  detailsContent: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -40, padding: 30 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#f0fdf4', marginBottom: 15 },
  categoryText: { fontSize: 10, fontWeight: '900', color: '#10b981', letterSpacing: 1 },
  productName: { fontSize: 28, fontWeight: '900', color: '#1f2937', marginTop: 10 },
  scientificName: { fontSize: 16, fontStyle: 'italic', color: '#94a3b8', marginTop: 4 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '900', color: '#1f2937', marginLeft: 4 },
  reviewText: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginLeft: 4 },
  salesBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  salesText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  priceText: { fontSize: 24, fontWeight: '900', color: '#10b981' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  stockText: { fontSize: 12, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 25 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937', marginBottom: 12 },
  descriptionText: { fontSize: 15, color: '#64748b', lineHeight: 24, fontWeight: '500' },
  featuresRow: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  supplierCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  supplierLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  supplierName: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  bottomBar: { paddingHorizontal: 25, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', gap: 12, backgroundColor: '#fff' },
  cartBtn: { width: 64, height: 64, borderRadius: 22, overflow: 'hidden', elevation: 2, shadowColor: '#10b981', shadowOpacity: 0.1, shadowRadius: 10 },
  cartBtnOutline: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' },
  buyBtn: { flex: 1, height: 64, borderRadius: 22, overflow: 'hidden', elevation: 8, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } },
  btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  summaryCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f5f9' },
  sumName: { fontWeight: '800', color: '#1f2937' },
  sumPrice: { fontWeight: '900', color: '#10b981' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, fontSize: 14, fontWeight: '600', color: '#111827', borderWidth: 1, borderColor: '#f1f5f9' },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  orderButton: { marginTop: 10, height: 56, borderRadius: 18, overflow: 'hidden' },
  successContainer: { alignItems: 'center', paddingVertical: 40 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937', marginTop: 20 },
  successDesc: { color: '#94a3b8', marginTop: 10 },
  journeySection: { backgroundColor: '#f5f3ff', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#ddd6fe' },
  journeyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  journeyTitle: { fontSize: 16, fontWeight: '900', color: '#7c3aed' },
  journeyContent: { paddingLeft: 10 },
  journeyStep: { flexDirection: 'row', minHeight: 60 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#c4b5fd', marginTop: 4 },
  stepLine: { position: 'absolute', left: 5, top: 16, bottom: 0, width: 2, backgroundColor: '#ddd6fe' },
  stepInfo: { marginLeft: 15, flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '800', color: '#1f2937' },
  stepDesc: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  logText: { fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 15 },
  verifiedText: { fontSize: 10, fontWeight: '900', color: '#10b981' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedTagText: { fontSize: 8, fontWeight: '900', color: '#059669' },
  supplierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  expBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  expText: { fontSize: 11, fontWeight: '800', color: '#8b5cf6' },
  heritageSection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  heritageTitle: { fontSize: 12, fontWeight: '900', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  heritageStory: { fontSize: 13, color: '#64748b', lineHeight: 20, fontStyle: 'italic' },
  reviewSection: { marginTop: 35, marginBottom: 20 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1f2937', letterSpacing: -0.5 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  avgRating: { fontSize: 14, fontWeight: '800', color: '#f59e0b', marginLeft: 8 },
  writeBtn: { backgroundColor: '#10b981', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, shadowColor: '#10b981', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  writeBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  reviewUserRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 12 },
  userInitial: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#dcfce7' },
  initialText: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  revUserName: { fontSize: 15, fontWeight: '800', color: '#1f2937' },
  revStars: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  revDate: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginLeft: 8 },
  revComment: { fontSize: 14, color: '#4b5563', lineHeight: 22, fontWeight: '500' },
  emptyReviews: { alignItems: 'center', paddingVertical: 50, backgroundColor: '#f8fafc', borderRadius: 32, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' },
  emptyRevText: { fontSize: 14, color: '#94a3b8', fontWeight: '700', marginTop: 12 },
  reviewModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, width: '100%', elevation: 25, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20 },
  ratingHint: { textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1f2937', marginBottom: 25 },
  ratingSelectRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 30 },
  submitRevBtn: { marginTop: 15, borderRadius: 20, overflow: 'hidden', height: 56 },
  deleteRevBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 10 },
});
