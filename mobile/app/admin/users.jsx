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
  FlatList,
  Alert
} from 'react-native';
import { 
  ChevronLeft, 
  Search, 
  User as UserIcon, 
  Trash2,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';

export default function UserManagementScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load user database');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (id, name) => {
    Alert.alert('Delete User', `Are you sure you want to remove ${name}? This action is permanent.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            try {
                await api.delete(`/admin/users/${id}`);
                fetchUsers();
            } catch (error) {
                Alert.alert('Error', 'Failed to delete user');
            }
        }}
    ]);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const UserCard = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? '#fee2e2' : '#f1f5f9' }]}>
        <UserIcon size={24} color={item.role === 'admin' ? '#ef4444' : '#64748b'} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.role?.toUpperCase()}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteUser(item._id, item.name)} style={styles.deleteBtn}>
        <Trash2 size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Registry</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput 
                style={styles.searchInput} 
                placeholder="Search by name, email or role..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1e293b" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
            data={filteredUsers}
            keyExtractor={item => item._id}
            renderItem={({ item }) => <UserCard item={item} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <ShieldAlert size={48} color="#e2e8f0" />
                    <Text style={styles.emptyText}>No matching users found.</Text>
                </View>
            }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  searchContainer: { paddingHorizontal: 25, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 15, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1f2937' },
  list: { padding: 25, paddingTop: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  avatar: { width: 50, height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: '900', color: '#1f2937' },
  email: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 5 },
  roleBadge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 9, fontWeight: '800', color: '#64748b' },
  deleteBtn: { padding: 10 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginTop: 15 }
});
