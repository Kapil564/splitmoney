import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { colors } from '../../constants/colors';
import { groupsAPI, friendsAPI } from '../../services/api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { User } from '../../types';

const groupTypes = [
  { id: 'home', label: 'Home', icon: 'home', color: '#FF7043' },
  { id: 'trip', label: 'Trip', icon: 'airplane', color: '#00BCD4' },
  { id: 'couple', label: 'Couple', icon: 'heart', color: '#E91E63' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal', color: '#5B9BD5' },
];

export const CreateGroupScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    friendsAPI.getAll().then((res) => setFriends(res.friends || [])).catch(() => {});
  }, []);

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a group name' });
      return;
    }
    setLoading(true);
    try {
      await groupsAPI.create({
        name: name.trim(),
        type,
        member_ids: selectedFriends,
      });
      Toast.show({ type: 'success', text1: 'Group created!' });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Group</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Name */}
        <Input label="Group Name" placeholder="Weekend Trip, Roommates, etc." value={name} onChangeText={setName} />

        {/* Type */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {groupTypes.map((gt) => (
            <TouchableOpacity
              key={gt.id}
              style={[styles.typeChip, type === gt.id && { borderColor: gt.color, backgroundColor: gt.color + '22' }]}
              onPress={() => setType(gt.id)}
            >
              <MaterialCommunityIcons name={gt.icon as any} size={18} color={type === gt.id ? gt.color : colors.textMuted} />
              <Text style={[styles.typeLabel, type === gt.id && { color: gt.color }]}>{gt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Friends */}
        <Text style={styles.label}>Add Members</Text>
        {friends.length === 0 ? (
          <View style={styles.noFriends}>
            <Text style={styles.noFriendsText}>Add friends first to add them to groups</Text>
          </View>
        ) : (
          friends.map((friend) => {
            const id = friend.id || (friend as any)._id;
            const selected = selectedFriends.includes(id);
            return (
              <TouchableOpacity
                key={id}
                style={[styles.friendRow, selected && styles.friendSelected]}
                onPress={() => toggleFriend(id)}
              >
                <Avatar name={`${friend.first_name} ${friend.last_name}`} size={38} />
                <Text style={styles.friendName}>{friend.first_name} {friend.last_name}</Text>
                <MaterialCommunityIcons
                  name={selected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={22}
                  color={selected ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })
        )}

        <Button
          title="Create Group"
          onPress={handleCreate}
          loading={loading}
          size="large"
          style={styles.createGroupBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, marginLeft: 4 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  typeLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  noFriends: { backgroundColor: colors.card, borderRadius: 14, padding: 20, alignItems: 'center' },
  noFriendsText: { color: colors.textSecondary, fontSize: 14 },
  friendRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  friendSelected: { borderWidth: 1, borderColor: colors.primary },
  friendName: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: colors.text },
  createGroupBtn: { marginTop: 24, marginBottom: 40 },
});
