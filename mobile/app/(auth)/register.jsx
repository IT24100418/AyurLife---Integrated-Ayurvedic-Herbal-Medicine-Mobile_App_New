import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';

const roles = [
    { value: 'patient', label: 'Patient', icon: 'account-heart', desc: 'Looking for care' },
    { value: 'doctor', label: 'Doctor', icon: 'doctor', desc: 'Practitioner' },
    { value: 'supplier', label: 'Supplier', icon: 'leaf', desc: 'Herb Vendor' },
    { value: 'producer', label: 'Producer', icon: 'flask-outline', desc: 'Medicine Lab' },
    { value: 'wellness_staff', label: 'Staff', icon: 'spa-outline', desc: 'Therapist' },
];

export default function RegisterScreen() {
    const router = useRouter();
    const { initialRole } = useLocalSearchParams();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(initialRole || 'patient');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/users', { name, email, password, role });
            Alert.alert('Success', 'Registration Successful! Please login to continue.', [
                { text: 'OK', onPress: () => router.push('/(auth)/login') }
            ]);
        } catch (error) {
            console.error('Registration error:', error);
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            Alert.alert('Registration Failed', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="chevron-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Join AyurLife</Text>
                    <Text style={styles.subtitle}>{role === 'patient' ? 'Start your wellness journey today' : 'Apply to join our professional network'}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>SELECT YOUR IDENTITY</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleScroll}>
                            {roles.map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[
                                        styles.roleCard,
                                        role === item.value && styles.activeRoleCard
                                    ]}
                                    onPress={() => setRole(item.value)}
                                >
                                    <View style={[styles.roleIconBox, role === item.value && styles.activeRoleIconBox]}>
                                        <MaterialCommunityIcons 
                                            name={item.icon} 
                                            size={26} 
                                            color={role === item.value ? '#fff' : '#9ca3af'} 
                                        />
                                    </View>
                                    <Text style={[styles.roleLabel, role === item.value && styles.activeRoleLabel]}>{item.label}</Text>
                                    <Text style={styles.roleDesc}>{item.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>FULL NAME</Text>
                        <View style={styles.inputContainer}>
                            <Feather name="user" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor="#9ca3af"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <View style={styles.inputContainer}>
                            <Feather name="mail" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PASSWORD</Text>
                        <View style={styles.inputContainer}>
                            <Feather name="lock" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.registerButton, loading && styles.disabledButton]} 
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Text style={styles.registerButtonText}>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</Text>
                                <Feather name="arrow-right" size={20} color="#ffffff" />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginText}>Sign in →</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginLeft: -5,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        marginTop: 6,
        fontWeight: '600',
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9ca3af',
        letterSpacing: 2,
        marginBottom: 12,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 20,
        height: 64,
    },
    inputIcon: {
        marginRight: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    roleScroll: {
        paddingVertical: 5,
        paddingLeft: 4,
    },
    roleCard: {
        width: 130,
        height: 140,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 15,
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    activeRoleCard: {
        borderColor: '#10b981',
        backgroundColor: '#ecfdf5',
        elevation: 4,
        shadowOpacity: 0.1,
    },
    roleIconBox: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeRoleIconBox: {
        backgroundColor: '#10b981',
    },
    roleLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: '#4b5563',
        marginBottom: 4,
    },
    activeRoleLabel: {
        color: '#065f46',
    },
    roleDesc: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '600',
        textAlign: 'center',
    },
    registerButton: {
        backgroundColor: '#10b981',
        height: 64,
        borderRadius: 22,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
        marginRight: 10,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '600',
    },
    loginText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '900',
    },
});
