import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { colors } from '../../constants/colors';
import { friendsAPI } from '../../services/api';
import { Avatar } from '../../components/common/Avatar';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { User, Friendship } from '../../types';

export const FriendsListScreen = () => {
  const [friends, setFriends] = useState<User[]>([]);
  const [pending, setPending] = useState<Friendship[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'friends' | 'pending'>('friends');

  const load = useCallback(async () => {
    try {
      const [fRes, pRes] = await Promise.all([friendsAPI.getAll(), friendsAPI.getPending()]);
      setFriends(fRes.friends || []);
      setPending(pRes.requests || []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const sendRequest = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      await friendsAPI.sendRequest(email.trim().toLowerCase());
      Toast.show({ type: 'success', text1: 'Friend request sent!' });
      setShowAdd(false);
      setEmail('');
      load();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setSending(false);
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      await friendsAPI.acceptRequest(id);
      Toast.show({ type: 'success', text1: 'Friend request accepted!' });
      load();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const removeFriend = (id: string, name: string) => {
    Alert.alert('Remove Friend', `Remove ${name} from your friends?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await friendsAPI.remove(id);
            Toast.show({ type: 'success', text1: 'Friend removed' });
            load();
          } catch {}
        },
      },
    ]);
  };

  const renderFriend = ({ item }: { item: User }) => (
    <View style={styles.friendCard}>
      <Avatar name={`${item.first_name} ${item.last_name}`} size={46} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        onPress={() => removeFriend(item.id || (item as any)._id, item.first_name)}
        style={styles.removeBtn}
      >
        <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const renderPending = ({ item }: { item: any }) => {
    const sender = item.user_id_1;
    return (
      <View style={styles.friendCard}>
        <Avatar name={`${sender.first_name} ${sender.last_name}`} size={46} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{sender.first_name} {sender.last_name}</Text>
          <Text style={styles.friendEmail}>{sender.email}</Text>
        </View>
        <TouchableOpacity
          onPress={() => acceptRequest(item._id || item.id)}
          style={styles.acceptBtn}
        >
          <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={() => setShowAdd(true)}>
          <MaterialCommunityIcons name="account-plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => setTab('friends')}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Pending ({pending.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'friends' ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id || (item as any)._id}
          renderItem={renderFriend}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="account-group-outline"
              title="No friends yet"
              subtitle="Add friends to start splitting expenses"
              action={<Button title="Add a Friend" onPress={() => setShowAdd(true)} size="small" />}
            />
          }
        />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderPending}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="clock-outline" title="No pending requests" subtitle="Friend requests will appear here" />
          }
        />
      )}

      {/* Add Friend Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => { setShowAdd(false); setEmail(''); }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Enter your friend's email address</Text>
            <Input
              placeholder="friend@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} />}
            />
            <Button title="Send Request" onPress={sendRequest} loading={sending} size="large" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  addBtnHeader: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: colors.textInverse },
  list: { paddingHorizontal: 20, flexGrow: 1 },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  friendInfo: { flex: 1, marginLeft: 12 },
  friendName: { fontSize: 15, fontWeight: '600', color: colors.text },
  friendEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
});
