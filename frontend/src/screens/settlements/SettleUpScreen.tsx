import React, { useState } from 'react';
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
import { settlementsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../constants/currencies';

export const SettleUpScreen = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const { userId, userName, amount, groupId } = route.params;
  const [settlementAmount, setSettlementAmount] = useState(Math.abs(amount).toFixed(2));
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  const methods = [
    { id: 'cash', label: 'Cash', icon: 'cash' },
    { id: 'bank', label: 'Bank Transfer', icon: 'bank' },
    { id: 'upi', label: 'UPI', icon: 'cellphone' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal' },
  ];

  const handleSettle = async () => {
    const numAmount = parseFloat(settlementAmount);
    if (!numAmount || numAmount <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid amount' });
      return;
    }

    setLoading(true);
    try {
      await settlementsAPI.create({
        to_user_id: userId,
        amount: numAmount,
        currency: user?.default_currency || 'USD',
        payment_method: paymentMethod,
        group_id: groupId,
        notes: notes.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'Settlement recorded!' });
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
          <Text style={styles.headerTitle}>Settle Up</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="handshake" size={36} color={colors.primary} />
          <Text style={styles.infoText}>
            You're settling up with{'\n'}
            <Text style={styles.infoName}>{userName}</Text>
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text style={styles.currencySign}>$</Text>
          <Input
            placeholder="0.00"
            value={settlementAmount}
            onChangeText={setSettlementAmount}
            keyboardType="decimal-pad"
            containerStyle={{ flex: 1, marginBottom: 0 }}
            style={styles.amountInput}
          />
        </View>

        {/* Payment Method */}
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodRow}>
          {methods.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.methodChip, paymentMethod === m.id && styles.methodActive]}
              onPress={() => setPaymentMethod(m.id)}
            >
              <MaterialCommunityIcons
                name={m.icon as any}
                size={18}
                color={paymentMethod === m.id ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.methodLabel, paymentMethod === m.id && { color: colors.primary }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Input
          label="Notes (optional)"
          placeholder="Add a note..."
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          title="Record Settlement"
          onPress={handleSettle}
          loading={loading}
          size="large"
          style={styles.settleBtn}
        />
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
  infoCard: {
    backgroundColor: colors.card, borderRadius: 18, padding: 24,
    alignItems: 'center', marginBottom: 24,
  },
  infoText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
  infoName: { fontSize: 18, fontWeight: '700', color: colors.text },
  amountWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  currencySign: { fontSize: 28, fontWeight: '800', color: colors.primary, marginRight: 8 },
  amountInput: { fontSize: 28, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, marginLeft: 4 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  methodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  methodLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  settleBtn: { marginTop: 16 },
});
