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
import { expensesAPI, friendsAPI, groupsAPI } from '../../services/api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { expenseCategories } from '../../constants/categories';
import { User, Group } from '../../types';

export const AddExpenseScreen = ({ route, navigation }: any) => {
  const groupIdParam = route?.params?.groupId;
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [notes, setNotes] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(groupIdParam);
  const [friends, setFriends] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedSplitUsers, setSelectedSplitUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    Promise.all([friendsAPI.getAll(), groupsAPI.getAll()])
      .then(([fRes, gRes]) => {
        setFriends(fRes.friends || []);
        setGroups(gRes.groups || []);
      })
      .catch(() => {});
  }, []);

  const toggleSplitUser = (id: string) => {
    setSelectedSplitUsers((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a description' });
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid amount' });
      return;
    }

    setLoading(true);
    try {
      const allParticipants = [user!.id, ...selectedSplitUsers];
      const splitAmount = parseFloat((numAmount / allParticipants.length).toFixed(2));

      await expensesAPI.create({
        description: description.trim(),
        amount: numAmount,
        category,
        notes: notes.trim() || undefined,
        group_id: selectedGroup,
        payers: [{ user_id: user!.id, amount_paid: numAmount }],
        splits: allParticipants.map((uid) => ({
          user_id: uid,
          amount_owed: splitAmount,
        })),
      });

      Toast.show({ type: 'success', text1: 'Expense added!' });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = expenseCategories.find((c) => c.id === category) || expenseCategories[0];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text style={styles.currencySign}>$</Text>
          <Input
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            containerStyle={{ flex: 1, marginBottom: 0 }}
            style={styles.amountInput}
          />
        </View>

        {/* Description */}
        <Input
          label="Description"
          placeholder="What was this expense for?"
          value={description}
          onChangeText={setDescription}
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.categoryPicker}
          onPress={() => setShowCategories(!showCategories)}
        >
          <View style={[styles.catIconSmall, { backgroundColor: selectedCat.color + '22' }]}>
            <MaterialCommunityIcons name={selectedCat.icon as any} size={18} color={selectedCat.color} />
          </View>
          <Text style={styles.categoryText}>{selectedCat.name}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {showCategories && (
          <View style={styles.categoryGrid}>
            {expenseCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, category === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '22' }]}
                onPress={() => { setCategory(cat.id); setShowCategories(false); }}
              >
                <MaterialCommunityIcons name={cat.icon as any} size={16} color={category === cat.id ? cat.color : colors.textMuted} />
                <Text style={[styles.catChipText, category === cat.id && { color: cat.color }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Group */}
        {groups.length > 0 && (
          <>
            <Text style={styles.label}>Group (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
              <TouchableOpacity
                style={[styles.groupChip, !selectedGroup && styles.groupChipActive]}
                onPress={() => setSelectedGroup(undefined)}
              >
                <Text style={[styles.groupChipText, !selectedGroup && styles.groupChipTextActive]}>
                  No group
                </Text>
              </TouchableOpacity>
              {groups.map((g) => {
                const gId = g.id || g._id;
                const active = selectedGroup === gId;
                return (
                  <TouchableOpacity
                    key={gId}
                    style={[styles.groupChip, active && styles.groupChipActive]}
                    onPress={() => setSelectedGroup(gId)}
                  >
                    <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Split with */}
        <Text style={styles.label}>Split with</Text>
        {friends.length === 0 ? (
          <View style={styles.noFriends}>
            <Text style={styles.noFriendsText}>Add friends first to split expenses</Text>
          </View>
        ) : (
          friends.map((friend) => {
            const id = friend.id || (friend as any)._id;
            const selected = selectedSplitUsers.includes(id);
            return (
              <TouchableOpacity
                key={id}
                style={[styles.friendRow, selected && styles.friendSelected]}
                onPress={() => toggleSplitUser(id)}
              >
                <Avatar name={`${friend.first_name} ${friend.last_name}`} size={36} />
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

        {/* Notes */}
        <Input
          label="Notes (optional)"
          placeholder="Add any notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          containerStyle={{ marginTop: 16 }}
        />

        {/* Summary */}
        {amount && selectedSplitUsers.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Split Summary</Text>
            <Text style={styles.summaryText}>
              ${(parseFloat(amount) / (selectedSplitUsers.length + 1)).toFixed(2)} per person
              {' '}({selectedSplitUsers.length + 1} people)
            </Text>
          </View>
        )}

        <Button
          title="Add Expense"
          onPress={handleCreate}
          loading={loading}
          size="large"
          style={styles.addBtn}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  amountWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  currencySign: { fontSize: 28, fontWeight: '800', color: colors.primary, marginRight: 8 },
  amountInput: { fontSize: 28, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, marginLeft: 4 },
  categoryPicker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 16,
  },
  catIconSmall: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  categoryText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  catChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  groupScroll: { marginBottom: 20 },
  groupChip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: colors.card, marginRight: 8, borderWidth: 1.5, borderColor: colors.border,
  },
  groupChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  groupChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  groupChipTextActive: { color: colors.primary },
  noFriends: { backgroundColor: colors.card, borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 16 },
  noFriendsText: { color: colors.textSecondary, fontSize: 14 },
  friendRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  friendSelected: { borderWidth: 1, borderColor: colors.primary },
  friendName: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: colors.text },
  summary: {
    backgroundColor: colors.primary + '15', borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 8,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  summaryText: { fontSize: 13, color: colors.textSecondary },
  addBtn: { marginTop: 16 },
});
