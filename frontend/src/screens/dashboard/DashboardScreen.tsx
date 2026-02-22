import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { expensesAPI, friendsAPI } from '../../services/api';
import { formatCurrency } from '../../constants/currencies';
import { calculateTotalBalance } from '../../utils/calculations';
import { formatTimeAgo } from '../../utils/date';
import { getCategoryById } from '../../constants/categories';
import { Avatar } from '../../components/common/Avatar';
import { User, Expense } from '../../types';

export const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [balances, setBalances] = useState({ totalOwed: 0, totalOwing: 0, netBalance: 0 });

  const loadData = useCallback(async () => {
    try {
      const [expRes, friendRes] = await Promise.all([
        expensesAPI.getAll(),
        friendsAPI.getAll(),
      ]);
      setExpenses(expRes.expenses || []);
      setFriends(friendRes.friends || []);
      if (user) {
        setBalances(calculateTotalBalance(user.id, expRes.expenses || []));
      }
    } catch {
      // silent
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const recentExpenses = expenses.slice(0, 8);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetText}>Hello,</Text>
            <Text style={styles.name}>{user?.first_name} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceRow}>
          <View style={[styles.balanceCard, { backgroundColor: '#0C2E1E' }]}>
            <View style={styles.balanceIconWrap}>
              <MaterialCommunityIcons name="arrow-down-circle" size={22} color={colors.positive} />
            </View>
            <Text style={styles.balanceLabel}>You are owed</Text>
            <Text style={[styles.balanceAmount, { color: colors.positive }]}>
              {formatCurrency(balances.totalOwed, user?.default_currency || 'USD')}
            </Text>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: '#2E1518' }]}>
            <View style={styles.balanceIconWrap}>
              <MaterialCommunityIcons name="arrow-up-circle" size={22} color={colors.negative} />
            </View>
            <Text style={styles.balanceLabel}>You owe</Text>
            <Text style={[styles.balanceAmount, { color: colors.negative }]}>
              {formatCurrency(balances.totalOwing, user?.default_currency || 'USD')}
            </Text>
          </View>
        </View>

        {/* Net balance */}
        <View style={styles.netCard}>
          <Text style={styles.netLabel}>Net Balance</Text>
          <Text
            style={[
              styles.netAmount,
              { color: balances.netBalance >= 0 ? colors.positive : colors.negative },
            ]}
          >
            {balances.netBalance >= 0 ? '+' : ''}
            {formatCurrency(balances.netBalance, user?.default_currency || 'USD')}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('AddExpense')}>
            <View style={[styles.quickIcon, { backgroundColor: '#0C2E1E' }]}>
              <MaterialCommunityIcons name="plus" size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Groups')}>
            <View style={[styles.quickIcon, { backgroundColor: '#1A1A2E' }]}>
              <MaterialCommunityIcons name="account-group" size={22} color="#5B9BD5" />
            </View>
            <Text style={styles.quickLabel}>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Friends')}>
            <View style={[styles.quickIcon, { backgroundColor: '#2E1A2E' }]}>
              <MaterialCommunityIcons name="account-plus" size={22} color="#AB47BC" />
            </View>
            <Text style={styles.quickLabel}>Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Expenses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentExpenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="receipt-text-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
          </View>
        ) : (
          recentExpenses.map((expense) => {
            const cat = getCategoryById(expense.category);
            const uid = (u: any) => (typeof u === 'object' ? u?._id || u?.id : u);
            const isPayer = expense.payers?.some((p) => uid(p.user_id) === user?.id);
            const userSplit = expense.splits?.find((s) => uid(s.user_id) === user?.id);
            let statusText = '';
            let statusColor = colors.textSecondary;
            if (isPayer && !userSplit) {
              statusText = 'you lent';
              statusColor = colors.positive;
            } else if (!isPayer && userSplit) {
              statusText = 'you borrowed';
              statusColor = colors.negative;
            } else {
              statusText = 'involved';
            }

            return (
              <TouchableOpacity
                key={expense.id || expense._id}
                style={styles.expenseCard}
                onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id || expense._id })}
                activeOpacity={0.7}
              >
                <View style={[styles.expenseCatIcon, { backgroundColor: cat.color + '22' }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDesc} numberOfLines={1}>{expense.description}</Text>
                  <Text style={styles.expenseDate}>{formatTimeAgo(expense.date)}</Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={[styles.expenseAmount, { color: statusColor }]}>
                    {formatCurrency(expense.amount, expense.currency)}
                  </Text>
                  <Text style={[styles.expenseStatus, { color: statusColor }]}>{statusText}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingTop: 60 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetText: { fontSize: 15, color: colors.textSecondary },
  name: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 2 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  balanceCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
  },
  balanceIconWrap: { marginBottom: 10 },
  balanceLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  balanceAmount: { fontSize: 22, fontWeight: '800' },
  netCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  netLabel: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  netAmount: { fontSize: 22, fontWeight: '800' },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  quickBtn: { flex: 1, alignItems: 'center' },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySubtext: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  expenseCatIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  expenseDate: { fontSize: 12, color: colors.textSecondary },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: '700' },
  expenseStatus: { fontSize: 11, marginTop: 2, fontWeight: '500' },
});
