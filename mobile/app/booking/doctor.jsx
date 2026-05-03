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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import api from '../../services/api';
import { useRouter } from 'expo-router';

export default function BookDoctorScreen() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Select Date/Time, 3: Confirm, 4: Payment, 5: Success
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    reason: ''
  });
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const doctorFee = 1500; // Simulated fee

  // Generate next 14 days based on doctor's availability
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    const hasAvailability = selectedDoctor?.availability && selectedDoctor.availability.length > 0;
    const availableDays = hasAvailability ? selectedDoctor.availability.map(a => a.day) : [];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // If no availability set, allow all days. Otherwise, filter by available days.
      if (!hasAvailability || availableDays.includes(dayName)) {
        dates.push(date);
      }
    }
    return dates;
  };

  const dates = selectedDoctor ? generateDates() : [];

  const timeSlots = [
    '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', 
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', 
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
  ];

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const isPM = timeStr.includes('PM');
    let hour = parseInt(timeStr.split(':')[0]);
    const min = parseInt(timeStr.split(':')[1].split(' ')[0]);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return hour * 60 + min;
  };

  const getAvailableTimeSlots = () => {
    if (!bookingData.date) return [];
    
    const today = new Date();
    const selectedDate = new Date(bookingData.date);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    const hasAvailability = selectedDoctor?.availability && selectedDoctor.availability.length > 0;
    const dayAvail = hasAvailability ? selectedDoctor.availability.find(a => a.day === dayName) : null;
    
    let availableSlots = timeSlots;
    
    // Filter by doctor's custom start/end time if available
    if (dayAvail && dayAvail.startTime && dayAvail.endTime) {
      const startMins = parseTime(dayAvail.startTime);
      const endMins = parseTime(dayAvail.endTime);
      
      availableSlots = availableSlots.filter(slot => {
        const slotMins = parseTime(slot);
        return slotMins >= startMins && slotMins <= endMins;
      });
    } else if (hasAvailability && !dayAvail) {
      return []; // Not available on this day
    }
    
    // If it's today, filter past times
    if (selectedDate.toDateString() === today.toDateString()) {
      const currentMins = today.getHours() * 60 + today.getMinutes();
      
      availableSlots = availableSlots.filter(slot => {
        return parseTime(slot) > currentMins;
      });
    }
    
    // Filter out already booked slots
    return availableSlots.filter(slot => !bookedSlots.includes(slot));
  };

  const fetchBookedSlots = async (doctorId, date) => {
    try {
      const { data } = await api.get(`/appointments/doctor/${doctorId}/booked-slots?date=${date}`);
      setBookedSlots(data);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  useEffect(() => {
    if (bookingData.date && selectedDoctor?.user?._id) {
      fetchBookedSlots(selectedDoctor.user._id, bookingData.date);
    }
  }, [bookingData.date, selectedDoctor]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/doctors');
      // Only show admin-approved (verified) doctors to patients
      setDoctors(data.filter(d => d.isVerified === true));
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!paymentData.cardNumber || !paymentData.expiry || !paymentData.cvv) {
      Alert.alert('Error', 'Please enter valid payment details');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/appointments', {
        doctorId: selectedDoctor.user._id,
        date: bookingData.date,
        time: bookingData.time,
        reason: bookingData.reason,
        paymentStatus: 'paid',
        paymentMethod: 'Card',
        amount: doctorFee,
        transactionId: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase()
      });
      setStep(5); // Success screen
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 && step < 5 ? setStep(step - 1) : router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Select Doctor' : step === 2 ? 'Schedule' : step === 3 ? 'Confirm' : step === 4 ? 'Payment' : 'Success'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Bar */}
      {step < 5 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Available Specialists</Text>
            {doctors.filter(d => d.user).map(doc => (
              <TouchableOpacity 
                key={doc._id} 
                style={[styles.doctorCard, selectedDoctor?._id === doc._id && styles.selectedCard]}
                onPress={() => {
                  setSelectedDoctor(doc);
                  setStep(2);
                }}
              >
                <View style={styles.doctorInfo}>
                  <View style={styles.avatarContainer}>
                    <User size={30} color="#94a3b8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName}>Dr. {doc.user?.name}</Text>
                    <Text style={styles.doctorSpecialty}>{doc.specialization || 'Ayurvedic General Physician'}</Text>
                    <View style={styles.ratingRow}>
                      <Stethoscope size={10} color="#10b981" />
                      <Text style={styles.ratingText}>Verified Specialist</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.selectedDocHeader}>
              <View style={styles.miniAvatar}>
                <User size={16} color="#3b82f6" />
              </View>
              <Text style={styles.docMiniText}>Booking with Dr. {selectedDoctor?.user?.name}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                {dates.map((date, index) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = bookingData.date === dateStr;
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                  
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                      onPress={() => {
                        setBookingData({...bookingData, date: dateStr, time: ''}); // reset time when date changes
                      }}
                    >
                      <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>{dayName}</Text>
                      <Text style={[styles.dateNum, isSelected && styles.selectedDateText]}>{dayNum}</Text>
                      <Text style={[styles.dateMonth, isSelected && styles.selectedDateText]}>{monthName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {bookingData.date ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Time Slot</Text>
                {getAvailableTimeSlots().length > 0 ? (
                  <View style={styles.timeGrid}>
                    {getAvailableTimeSlots().map((slot, index) => {
                      const isSelected = bookingData.time === slot;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                          onPress={() => setBookingData({...bookingData, time: slot})}
                        >
                          <Text style={[styles.timeText, isSelected && styles.selectedTimeText]}>{slot}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.noTimeBox}>
                    <AlertCircle size={20} color="#d97706" />
                    <Text style={styles.noTimeText}>No available slots for the selected date. Please choose another date.</Text>
                  </View>
                )}
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason for Visit</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Briefly describe your health concerns..."
                multiline
                numberOfLines={4}
                value={bookingData.reason}
                onChangeText={(val) => setBookingData({...bookingData, reason: val})}
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.nextGradient}>
                <Text style={styles.nextButtonText}>Review Table</Text>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.confirmTitle}>Appointment Summary</Text>
            
            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <User size={18} color="#94a3b8" />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>DOCTOR</Text>
                  <Text style={styles.confirmValue}>Dr. {selectedDoctor?.user?.name}</Text>
                </View>
              </View>

              <View style={styles.confirmRow}>
                <CalendarIcon size={18} color="#94a3b8" />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>DATE</Text>
                  <Text style={styles.confirmValue}>{bookingData.date}</Text>
                </View>
              </View>

              <View style={styles.confirmRow}>
                <Clock size={18} color="#94a3b8" />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>TIME</Text>
                  <Text style={styles.confirmValue}>{bookingData.time}</Text>
                </View>
              </View>

              <View style={styles.confirmRow}>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>CONSULTATION FEE</Text>
                  <Text style={[styles.confirmValue, { color: '#10b981', fontSize: 18 }]}>LKR {doctorFee.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={() => setStep(4)}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.nextGradient}>
                <Text style={styles.nextButtonText}>Proceed to Payment</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.confirmTitle}>Secure Payment</Text>
            
            <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.creditCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.cardBrand}>PLATINUM CARE</Text>
                    <Image source={{ uri: 'https://img.icons8.com/color/48/000000/visa.png' }} style={{ width: 40, height: 25 }} />
                </View>
                <Text style={styles.cardNumberDisplay}>
                    {paymentData.cardNumber ? paymentData.cardNumber.replace(/(\d{4})/g, '$1 ').trim() : 'XXXX XXXX XXXX XXXX'}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={styles.cardLabel}>CARD HOLDER</Text>
                        <Text style={styles.cardValue}>{paymentData.name || 'FULL NAME'}</Text>
                    </View>
                    <View>
                        <Text style={styles.cardLabel}>EXPIRES</Text>
                        <Text style={styles.cardValue}>{paymentData.expiry || 'MM/YY'}</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="John Doe"
                    value={paymentData.name}
                    onChangeText={val => setPaymentData({...paymentData, name: val})}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="4111 1111 1111 1111"
                    keyboardType="numeric"
                    maxLength={16}
                    value={paymentData.cardNumber}
                    onChangeText={val => setPaymentData({...paymentData, cardNumber: val})}
                />
            </View>

            <View style={{ flexDirection: 'row', gap: 15 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="MM/YY"
                        maxLength={5}
                        value={paymentData.expiry}
                        onChangeText={val => setPaymentData({...paymentData, expiry: val})}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="***"
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                        value={paymentData.cvv}
                        onChangeText={val => setPaymentData({...paymentData, cvv: val})}
                    />
                </View>
            </View>

            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleBooking}
              disabled={submitting}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.nextGradient}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextButtonText}>Pay LKR {doctorFee.toLocaleString()}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20, opacity: 0.5 }}>
                <CheckCircle2 size={14} color="#64748b" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>SSL Secured Payment</Text>
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.successContainer}>
            <LinearGradient colors={['#ecfdf5', '#f0fdf4']} style={styles.successCircle}>
              <CheckCircle2 size={80} color="#10b981" />
            </LinearGradient>
            <Text style={styles.successTitle}>Confirmed!</Text>
            <Text style={styles.successDesc}>
              Payment successful! Your appointment request has been sent to Dr. {selectedDoctor?.user?.name}.
            </Text>
            
            <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)/services')}>
              <Text style={styles.homeButtonText}>Go to Appointments</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  creditCard: {
    height: 200,
    borderRadius: 24,
    padding: 25,
    marginBottom: 30,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  cardBrand: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    opacity: 0.8,
  },
  cardNumberDisplay: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    marginVertical: 15,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
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
    backgroundColor: '#10b981',
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
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1f2937',
  },
  doctorSpecialty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  stepContainer: {
    flex: 1,
  },
  selectedDocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 16,
    marginBottom: 25,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docMiniText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
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
  helperText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
    marginLeft: 10,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dateScroll: {
    paddingVertical: 5,
    gap: 12,
  },
  dateCard: {
    width: 65,
    height: 85,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedDateCard: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dateNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1f2937',
    marginVertical: 2,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  selectedDateText: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '31%', // roughly 3 columns
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  selectedTimeText: {
    color: '#059669',
  },
  noTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noTimeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '600',
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
    shadowColor: '#10b981',
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
    backgroundColor: '#f8fafc',
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 15,
    borderRadius: 18,
    gap: 10,
    marginBottom: 25,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#b45309',
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
    backgroundColor: '#1f2937',
    borderRadius: 20,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  }
});
