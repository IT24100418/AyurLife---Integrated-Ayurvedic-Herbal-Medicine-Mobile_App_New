import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rolePrefix, setRolePrefix] = useState('Patient'); // To toggle header text
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/users/login', { email, password });
            await AsyncStorage.setItem('userInfo', JSON.stringify(data));
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            Alert.alert('Login Failed', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.backBtn}>
                        <Feather name="chevron-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    
                    <View style={styles.logoContainer}>
                        <MaterialCommunityIcons name="leaf" size={44} color="#10b981" />
                    </View>
                    <Text style={styles.title}>{rolePrefix} Portal</Text>
                    <Text style={styles.subtitle}>Sign in to your AyurLife account</Text>
                    
                    <View style={styles.personaToggle}>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, rolePrefix === 'Patient' && styles.activeToggle]}
                            onPress={() => setRolePrefix('Patient')}
                        >
                            <Text style={[styles.toggleText, rolePrefix === 'Patient' && styles.activeToggleText]}>Patient</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, rolePrefix === 'Professional' && styles.activeToggle]}
                            onPress={() => setRolePrefix('Professional')}
                        >
                            <Text style={[styles.toggleText, rolePrefix === 'Professional' && styles.activeToggleText]}>Professional</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.form}>
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
                        style={[styles.loginButton, loading && styles.disabledButton]} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Sign In to AyurLife</Text>
                                <Feather name="arrow-right" size={20} color="#ffffff" />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signupText}>Create one free →</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                <View style={styles.trustBadge}>
                    <MaterialCommunityIcons name="shield-check" size={16} color="#10b981" />
                    <Text style={styles.trustText}>SECURE SSL · TRUSTED BY 10K+</Text>
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
        alignItems: 'center',
        marginBottom: 40,
    },
    backBtn: {
        alignSelf: 'flex-start',
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoContainer: {
        width: 90,
        height: 90,
        backgroundColor: '#ecfdf5',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 6,
        fontWeight: '600',
    },
    personaToggle: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 6,
        borderRadius: 18,
        marginTop: 25,
        width: '100%',
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 14,
    },
    activeToggle: {
        backgroundColor: '#ffffff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    activeToggleText: {
        color: '#10b981',
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9ca3af',
        letterSpacing: 2,
        marginBottom: 8,
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
    loginButton: {
        backgroundColor: '#10b981',
        height: 64,
        borderRadius: 22,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    loginButtonText: {
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
    signupText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '900',
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 30,
    },
    trustText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#cbd5e1',
        marginLeft: 8,
        letterSpacing: 1.5,
    },
});
