import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { colors } from '../../constants/colors';
import { expensesAPI } from '../../services/api';
import { formatCurrency } from '../../constants/currencies';
import { formatDate } from '../../utils/date';
import { getCategoryById } from '../../constants/categories';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { Expense, User } from '../../types';

export const ExpenseDetailScreen = ({ route, navigation }: any) => {
  const { expenseId } = route.params;
  const { user } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    expensesAPI
      .getById(expenseId)
      .then((res) => setExpense(res.expense))
      .catch(() => Toast.show({ type: 'error', text1: 'Failed to load expense' }));
  }, [expenseId]);

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await expensesAPI.delete(expenseId);
            Toast.show({ type: 'success', text1: 'Expense deleted' });
            navigation.goBack();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message });
          }
        },
      },
    ]);
  };

  if (!expense) return <View style={styles.root} />;

  const cat = getCategoryById(expense.category);
  const getUserName = (u: string | User): string => {
    if (typeof u === 'object' && u) return `${u.first_name} ${u.last_name}`;
    if (u === user?.id) return 'You';
    return 'Unknown';
  };

  const uid = (u: any): string => (typeof u === 'object' ? u?._id || u?.id : u);
  const isCreator = uid(expense.created_by) === user?.id;
  const groupName = typeof expense.group_id === 'object' ? expense.group_id?.name : null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Amount & Info */}
        <View style={styles.hero}>
          <View style={[styles.catIconLarge, { backgroundColor: cat.color + '22' }]}>
            <MaterialCommunityIcons name={cat.icon as any} size={32} color={cat.color} />
          </View>
          <Text style={styles.amount}>{formatCurrency(expense.amount, expense.currency)}</Text>
          <Text style={styles.description}>{expense.description}</Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatDate(expense.date)}</Text>
            {groupName && (
              <>
                <MaterialCommunityIcons name="account-group" size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                <Text style={styles.metaText}>{groupName}</Text>
              </>
            )}
          </View>
        </View>

        {/* Paid By */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paid by</Text>
          {expense.payers?.map((p, i) => (
            <View key={i} style={styles.personRow}>
              <Avatar name={getUserName(p.user_id)} size={36} />
              <Text style={styles.personName}>{getUserName(p.user_id)}</Text>
              <Text style={styles.personAmount}>
                {formatCurrency(p.amount_paid, expense.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Split Between */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split between</Text>
          {expense.splits?.map((s, i) => (
            <View key={i} style={styles.personRow}>
              <Avatar name={getUserName(s.user_id)} size={36} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{getUserName(s.user_id)}</Text>
                {s.settled && <Text style={styles.settledTag}>Settled</Text>}
              </View>
              <Text
                style={[
                  styles.personAmount,
                  { color: s.settled ? colors.neutral : colors.negative },
                ]}
              >
                {formatCurrency(s.amount_owed, expense.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {expense.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  catIconLarge: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  amount: { fontSize: 36, fontWeight: '800', color: colors.text, marginBottom: 4 },
  description: { fontSize: 18, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: colors.textSecondary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  personRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  personInfo: { flex: 1, marginLeft: 10 },
  personName: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: colors.text },
  personAmount: { fontSize: 15, fontWeight: '700', color: colors.text },
  settledTag: {
    fontSize: 11, color: colors.primary, fontWeight: '600',
    backgroundColor: colors.primary + '22', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, alignSelf: 'flex-start', marginTop: 2,
  },
  notesCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16 },
  notesText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
