import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { notificationsAPI, expensesAPI } from '../../services/api';
import { formatTimeAgo } from '../../utils/date';
import { formatCurrency } from '../../constants/currencies';
import { getCategoryById } from '../../constants/categories';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { Notification, Expense } from '../../types';

export const ActivityFeedScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'expenses' | 'notifications'>('expenses');

  const load = useCallback(async () => {
    try {
      const [nRes, eRes] = await Promise.all([
        notificationsAPI.getAll(),
        expensesAPI.getAll(),
      ]);
      setNotifications(nRes.notifications || []);
      setExpenses(eRes.expenses || []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const renderExpense = ({ item }: { item: Expense }) => {
    const cat = getCategoryById(item.category);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id || item._id })}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
          <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.cardTime}>{formatTimeAgo(item.date)}</Text>
        </View>
        <Text style={styles.cardAmount}>{formatCurrency(item.amount, item.currency)}</Text>
      </TouchableOpacity>
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.unread]}
      onPress={async () => {
        if (!item.read) {
          await notificationsAPI.markRead(item.id || item._id || '');
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
          );
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
        <MaterialCommunityIcons name="bell" size={20} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.cardTime}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      {!item.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        {tab === 'notifications' && unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'expenses' && styles.tabActive]}
          onPress={() => setTab('expenses')}
        >
          <Text style={[styles.tabText, tab === 'expenses' && styles.tabTextActive]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'notifications' && styles.tabActive]}
          onPress={() => setTab('notifications')}
        >
          <Text style={[styles.tabText, tab === 'notifications' && styles.tabTextActive]}>
            Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'expenses' ? (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id || item._id || ''}
          renderItem={renderExpense}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="receipt-text-outline" title="No expenses yet" subtitle="Your expense history will appear here" />
          }
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id || item._id || ''}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="bell-off-outline" title="No notifications" subtitle="You're all caught up!" />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  markAll: { fontSize: 14, fontWeight: '600', color: colors.primary },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.card, alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: colors.textInverse },
  list: { paddingHorizontal: 20, flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  unread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  cardTime: { fontSize: 12, color: colors.textMuted },
  cardAmount: { fontSize: 15, fontWeight: '700', color: colors.text },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary, marginLeft: 8,
  },
});
