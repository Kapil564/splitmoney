import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { colors } from '../../constants/colors';
import { groupsAPI, expensesAPI } from '../../services/api';
import { formatCurrency } from '../../constants/currencies';
import { formatTimeAgo } from '../../utils/date';
import { getCategoryById } from '../../constants/categories';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { Group, Expense, User } from '../../types';

export const GroupDetailScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [gRes, eRes] = await Promise.all([
        groupsAPI.getById(groupId),
        expensesAPI.getAll(groupId),
      ]);
      setGroup(gRes.group);
      setExpenses(eRes.expenses || []);
    } catch {}
  }, [groupId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = () => {
    Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupsAPI.delete(groupId);
            Toast.show({ type: 'success', text1: 'Group deleted' });
            navigation.goBack();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message });
          }
        },
      },
    ]);
  };

  if (!group) return <View style={styles.root} />;

  const members = group.members || [];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        <View style={styles.groupInfo}>
          <View style={styles.groupIconLarge}>
            <MaterialCommunityIcons name="account-group" size={36} color={colors.primary} />
          </View>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMeta}>
            {group.type} · {members.length} member{members.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          {members.map((m, i) => {
            const u = (typeof m.user_id === 'object' ? m.user_id : null) as User | null;
            const name = u ? `${u.first_name} ${u.last_name}` : 'Unknown';
            return (
              <View key={i} style={styles.memberRow}>
                <Avatar name={name} size={36} />
                <Text style={styles.memberName}>{name}</Text>
                {u?.email && <Text style={styles.memberEmail}>{u.email}</Text>}
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Add Expense"
            onPress={() => navigation.navigate('AddExpense', { groupId })}
            icon={<MaterialCommunityIcons name="plus" size={18} color={colors.textInverse} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {expenses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No expenses in this group yet</Text>
            </View>
          ) : (
            expenses.map((expense) => {
              const cat = getCategoryById(expense.category);
              return (
                <TouchableOpacity
                  key={expense.id || expense._id}
                  style={styles.expenseCard}
                  onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id || expense._id })}
                >
                  <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={18} color={cat.color} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDesc} numberOfLines={1}>{expense.description}</Text>
                    <Text style={styles.expenseDate}>{formatTimeAgo(expense.date)}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.amount, expense.currency)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  groupInfo: { alignItems: 'center', marginBottom: 28 },
  groupIconLarge: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  groupName: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  groupMeta: { fontSize: 14, color: colors.textSecondary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  memberName: { fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: 10, flex: 1 },
  memberEmail: { fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  emptyCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 24, alignItems: 'center',
  },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  expenseCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  catIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  expenseDate: { fontSize: 12, color: colors.textSecondary },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: colors.text },
});
