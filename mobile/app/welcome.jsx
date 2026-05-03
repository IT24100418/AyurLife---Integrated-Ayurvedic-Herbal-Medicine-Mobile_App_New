import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, Stethoscope, Leaf, ArrowRight, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    const handlePersonaSelect = (role) => {
        router.push({
            pathname: '/(auth)/register',
            params: { initialRole: role }
        });
    };

    return (
        <View style={styles.container}>
            {/* Background Image / Pattern */}
            <View style={styles.bgContainer}>
                <LinearGradient
                    colors={['#10b981', '#059669', '#064e3b']}
                    style={styles.gradient}
                />
                <View style={[styles.circle, { top: -100, right: -100, width: 300, height: 300, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                <View style={[styles.circle, { bottom: -50, left: -50, width: 250, height: 250, backgroundColor: 'rgba(255,255,255,0.05)' }]} />
            </View>

            <SafeAreaView style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Leaf size={40} color="#fff" />
                    </View>
                    <Text style={styles.brandName}>AyurLife</Text>
                    <Text style={styles.tagline}>Harmonizing Body & Soul</Text>
                </View>

                <View style={styles.cardContainer}>
                    <Text style={styles.welcomeLabel}>CHOOSE YOUR PATH</Text>
                    
                    {/* Patient Path */}
                    <TouchableOpacity 
                        style={styles.personaCard}
                        onPress={() => handlePersonaSelect('patient')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8fafc']}
                            style={styles.cardGradient}
                        >
                            <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
                                <Heart size={28} color="#10b981" />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>Personalized Care</Text>
                                <Text style={styles.cardSub}>I am here to find balance and get treatment.</Text>
                            </View>
                            <ArrowRight size={20} color="#10b981" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Professional Path */}
                    <TouchableOpacity 
                        style={styles.personaCard}
                        onPress={() => handlePersonaSelect('doctor')} // Defaults to doctor but allows selection
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8fafc']}
                            style={styles.cardGradient}
                        >
                            <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                                <Stethoscope size={28} color="#3b82f6" />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>Professional Portal</Text>
                                <Text style={styles.cardSub}>I am a Practitioner, Supplier, or Producer.</Text>
                            </View>
                            <ArrowRight size={20} color="#3b82f6" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginHighlight}>Sign In</Text></Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#064e3b',
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 30,
    },
    header: {
        alignItems: 'center',
        marginTop: height * 0.1,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    brandName: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        marginTop: 5,
    },
    cardContainer: {
        marginBottom: 50,
    },
    welcomeLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 25,
    },
    personaCard: {
        marginBottom: 20,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    cardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 25,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1f2937',
    },
    cardSub: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
        fontWeight: '500',
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    loginText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    loginHighlight: {
        color: '#fff',
        fontWeight: '900',
        textDecorationLine: 'underline',
    },
});
