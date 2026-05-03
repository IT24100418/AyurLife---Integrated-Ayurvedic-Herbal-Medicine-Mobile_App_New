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
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Heart, 
  CheckCircle2,
  AlertCircle,
  Zap,
  Leaf
} from 'lucide-react-native';
import api from '../../services/api';
import { useRouter } from 'expo-router';
import Config from '../../constants/Config';

const { width } = Dimensions.get('window');

export default function BookTherapyScreen() {
  const [therapies, setTherapies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Select Therapy, 2: Select Date/Time, 3: Confirm
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: '',
    paymentMethod: 'Cash'
  });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTherapies();
  }, []);

  const fetchTherapies = async () => {
    try {
      const { data } = await api.get('/wellness');
      setTherapies(data);
    } catch (error) {
      console.error('Error fetching therapies:', error);
      Alert.alert('Error', 'Failed to load therapies');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async (date) => {
    if (!selectedTherapy || !date) return;
    try {
      const { data } = await api.get(`/wellness/slots?therapyId=${selectedTherapy._id}&date=${date}`);
      setBookedSlots(data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const validateDate = (dateString) => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(selectedDate.getTime())) return false;
    if (selectedDate < today) {
      Alert.alert('Error', 'Not valid date');
      return false;
    }
    return true;
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push({
        full: d.toISOString().split('T')[0],
        day: d.getDate(),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return dates;
  };

  const AVAILABLE_DATES = getAvailableDates();

  const TIME_SLOTS = [
    '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const matched = cleaned.match(/.{1,4}/g);
    return matched ? matched.join(' ') : cleaned;
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validateCardData = () => {
    if (bookingData.paymentMethod !== 'Card') return true;

    const { number, expiry, cvv, name } = cardData;
    const cleanNumber = number.replace(/\s/g, '');

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter cardholder name');
      return false;
    }

    if (cleanNumber.length !== 16) {
      Alert.alert('Error', 'Invalid card number');
      return false;
    }

    if (expiry.length !== 5) {
      Alert.alert('Error', 'Invalid expiry date (MM/YY)');
      return false;
    }

    const [month, year] = expiry.split('/').map(n => parseInt(n));
    if (month < 1 || month > 12) {
      Alert.alert('Error', 'Invalid month in expiry date');
      return false;
    }

    const now = new Date();
    const currentYear = parseInt(now.getFullYear().toString().slice(-2));
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      Alert.alert('Error', 'Card has expired');
      return false;
    }

    if (cvv.length < 3) {
      Alert.alert('Error', 'Invalid CVV');
      return false;
    }

    return true;
  };

  const handleBooking = async () => {
    if (!bookingData.date || !bookingData.time) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    if (!validateCardData()) return;

    setSubmitting(true);
    try {
      await api.post('/wellness/bookings', {
        therapyId: selectedTherapy._id,
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes,
        paymentMethod: bookingData.paymentMethod
      });
      setStep(4); // Success
    } catch (error) {
      console.error('Error booking therapy:', error);
      Alert.alert('Error', 'Failed to book therapy session.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f43f5e" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 && step < 4 ? setStep(step - 1) : router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Select therapy' : step === 2 ? 'Schedule' : step === 3 ? 'Confirm' : step === 3.5 ? 'Payment' : 'Success'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress */}
      {step < 4 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%`, backgroundColor: '#f43f5e' }]} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Wellness Programs</Text>
            {therapies.map(therapy => (
              <TouchableOpacity 
                key={therapy._id} 
                style={[styles.therapyCard, selectedTherapy?._id === therapy._id && styles.selectedCard]}
                onPress={() => {
                  setSelectedTherapy(therapy);
                  setStep(2);
                }}
              >
                <View style={styles.cardRow}>
                  <View style={styles.therapyIconBox}>
                    {therapy.image ? (
                        <Image 
                            source={{ uri: therapy.image.startsWith('/uploads') ? `${Config.BASE_URL.replace('/api', '')}${therapy.image}` : therapy.image }} 
                            style={{ width: '100%', height: '100%', borderRadius: 18 }} 
                        />
                    ) : (
                        <Heart size={24} color="#f43f5e" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.therapyName}>{therapy.name}</Text>
                    <Text style={styles.therapyDuration}>{therapy.durationMinutes} mins • LKR {therapy.price}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
                </View>
                <Text style={styles.therapyDesc} numberOfLines={2}>{therapy.description}</Text>
                
                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <Leaf size={10} color="#059669" />
                    <Text style={styles.tagText}>Organic Oils</Text>
                  </View>
                  <View style={styles.tag}>
                    <Zap size={10} color="#d97706" />
                    <Text style={styles.tagText}>Expert Therapists</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.selectedHeader}>
              <Heart size={18} color="#f43f5e" />
              <Text style={styles.miniHeaderTitle}>Booking {selectedTherapy?.name}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                {AVAILABLE_DATES.map(item => (
                    <TouchableOpacity 
                        key={item.full} 
                        style={[styles.dateCard, bookingData.date === item.full && styles.selectedDateCard]}
                        onPress={() => {
                            setBookingData({...bookingData, date: item.full});
                            fetchBookedSlots(item.full);
                        }}
                    >
                        <Text style={[styles.dateWeekday, bookingData.date === item.full && styles.selectedDateText]}>{item.weekday}</Text>
                        <Text style={[styles.dateDay, bookingData.date === item.full && styles.selectedDateText]}>{item.day}</Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Time Slot</Text>
              <View style={styles.slotsGrid}>
                {TIME_SLOTS.map(slot => {
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <TouchableOpacity 
                      key={slot} 
                      style={[
                        styles.slotBtn, 
                        bookingData.time === slot && styles.selectedSlot,
                        isBooked && styles.bookedSlot
                      ]}
                      onPress={() => !isBooked && setBookingData({...bookingData, time: slot})}
                      disabled={isBooked}
                    >
                      <Text style={[
                        styles.slotText, 
                        bookingData.time === slot && styles.selectedSlotText,
                        isBooked && styles.bookedSlotText
                      ]}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Preferences</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any health conditions or specific requests?"
                multiline
                numberOfLines={4}
                value={bookingData.notes}
                onChangeText={(val) => setBookingData({...bookingData, notes: val})}
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
              <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.nextGradient}>
                <Text style={styles.nextButtonText}>Review Summary</Text>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.confirmTitle}>Booking Details</Text>
            
            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Heart size={18} color="#f43f5e" />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>THERAPY TYPE</Text>
                  <Text style={styles.confirmValue}>{selectedTherapy?.name}</Text>
                </View>
              </View>

              <View style={styles.confirmRow}>
                <CalendarIcon size={18} color="#94a3b8" />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>SCHEDULED DATE</Text>
                  <Text style={styles.confirmValue}>{bookingData.date}</Text>
                </View>
              </View>

              <View style={styles.confirmRow}>
                <Clock size={18} color="#94a3b8" />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>TIME SLOT</Text>
                  <Text style={styles.confirmValue}>{bookingData.time}</Text>
                </View>
              </View>

              <View style={styles.confirmRow}>
                <Leaf size={18} color="#059669" />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>TOTAL COST</Text>
                  <Text style={[styles.confirmValue, { color: '#059669' }]}>LKR {selectedTherapy?.price}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Select Payment Method</Text>
            <View style={styles.paymentContainer}>
              <TouchableOpacity 
                style={[styles.paymentOption, bookingData.paymentMethod === 'Cash' && styles.selectedPayment]} 
                onPress={() => setBookingData({...bookingData, paymentMethod: 'Cash'})}
              >
                <Text style={[styles.paymentText, bookingData.paymentMethod === 'Cash' && styles.selectedPaymentText]}>Cash at Center</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.paymentOption, bookingData.paymentMethod === 'Card' && styles.selectedPayment]} 
                onPress={() => setBookingData({...bookingData, paymentMethod: 'Card'})}
              >
                <Text style={[styles.paymentText, bookingData.paymentMethod === 'Card' && styles.selectedPaymentText]}>Online Payment</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <AlertCircle size={16} color="#0284c7" />
              <Text style={styles.infoText}>
                Confirmation will be sent via SMS and email within 1 hour.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={() => bookingData.paymentMethod === 'Card' ? setStep(3.5) : handleBooking()}
              disabled={submitting}
            >
              <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.nextGradient}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {bookingData.paymentMethod === 'Card' ? 'Proceed to Payment' : 'Finalize Booking'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 3.5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.confirmTitle}>Secure Payment</Text>
            <View style={styles.cardPreview}>
                <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.cardGradient}>
                    <Text style={styles.cardLabel}>CARD NUMBER</Text>
                    <Text style={styles.cardValue}>{cardData.number || '•••• •••• •••• ••••'}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                        <View>
                            <Text style={styles.cardLabel}>HOLDER NAME</Text>
                            <Text style={styles.cardValueSmall}>{cardData.name || 'YOUR NAME'}</Text>
                        </View>
                        <View>
                            <Text style={styles.cardLabel}>EXPIRY</Text>
                            <Text style={styles.cardValueSmall}>{cardData.expiry || 'MM/YY'}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={cardData.name}
                    onChangeText={(val) => setCardData({...cardData, name: val})}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0000 0000 0000 0000"
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardData.number}
                    onChangeText={(val) => setCardData({...cardData, number: formatCardNumber(val)})}
                />
            </View>

            <View style={{ flexDirection: 'row', gap: 15 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        keyboardType="numeric"
                        maxLength={5}
                        value={cardData.expiry}
                        onChangeText={(val) => setCardData({...cardData, expiry: formatExpiry(val)})}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="123"
                        secureTextEntry
                        keyboardType="numeric"
                        maxLength={3}
                        value={cardData.cvv}
                        onChangeText={(val) => setCardData({...cardData, cvv: val.replace(/\D/g, '')})}
                    />
                </View>
            </View>

            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleBooking}
              disabled={submitting || !cardData.name || !cardData.number}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.nextGradient}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextButtonText}>Pay LKR {selectedTherapy?.price}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          <View style={styles.successContainer}>
            <LinearGradient colors={['#fff1f2', '#fef2f2']} style={styles.successCircle}>
              <CheckCircle2 size={80} color={bookingData.paymentMethod === 'Card' ? '#10b981' : '#f43f5e'} />
            </LinearGradient>
            <Text style={styles.successTitle}>
              {bookingData.paymentMethod === 'Card' ? 'Payment Successful!' : 'Booking Requested!'}
            </Text>
            <Text style={styles.successDesc}>
              {bookingData.paymentMethod === 'Card' 
                ? `LKR ${selectedTherapy?.price} has been paid successfully for ${selectedTherapy?.name}. Your session is confirmed.`
                : `We've received your booking request for ${selectedTherapy?.name}. Please pay at the center upon arrival.`}
            </Text>
            
            <TouchableOpacity style={[styles.homeButton, { backgroundColor: '#f43f5e' }]} onPress={() => router.replace('/(tabs)/services')}>
              <Text style={styles.homeButtonText}>My Wellness Schedule</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#1f2937',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#f1f5f9',
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  scrollContent: {
    padding: 25,
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 20,
  },
  therapyCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectedCard: {
    borderColor: '#f43f5e',
    backgroundColor: '#fff1f2',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 12,
  },
  therapyIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  therapyName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1f2937',
  },
  therapyDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f43f5e',
    marginTop: 2,
  },
  therapyDesc: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 15,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  stepContainer: {
    flex: 1,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 16,
    marginBottom: 25,
  },
  miniHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991b1b',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
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
  nextButton: {
    marginTop: 10,
  },
  nextGradient: {
    height: 65,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 20,
  },
  confirmCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 20,
    marginBottom: 25,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  confirmInfo: {
    flex: 1,
  },
  confirmLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  confirmValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 18,
    gap: 10,
    marginBottom: 25,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  confirmButton: {
    marginTop: 10,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '500',
    marginBottom: 40,
  },
  homeButton: {
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 20,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  paymentContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  selectedPayment: {
    borderColor: '#f43f5e',
    backgroundColor: '#fff1f2',
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  selectedPaymentText: {
    color: '#f43f5e',
  },
  cardPreview: {
    marginBottom: 30,
  },
  cardGradient: {
    padding: 25,
    borderRadius: 24,
    height: 180,
    justifyContent: 'center',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 5,
  },
  cardValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardValueSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: '22%',
    alignItems: 'center',
  },
  selectedSlot: {
    backgroundColor: '#f43f5e',
    borderColor: '#f43f5e',
  },
  bookedSlot: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.5,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  selectedSlotText: {
    color: '#fff',
  },
  bookedSlotText: {
    color: '#cbd5e1',
    textDecorationLine: 'line-through',
  },
  dateList: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  dateCard: {
    width: 65,
    height: 80,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedDateCard: {
    backgroundColor: '#f43f5e',
    borderColor: '#f43f5e',
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dateWeekday: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1f2937',
  },
  selectedDateText: {
    color: '#fff',
  }
});
