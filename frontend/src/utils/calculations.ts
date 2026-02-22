import { Balance } from '../types';

/** Split total amount equally among participants */
export const calculateEqualSplit = (
  total: number,
  participantIds: string[]
): Record<string, number> => {
  const share = parseFloat((total / participantIds.length).toFixed(2));
  const result: Record<string, number> = {};
  participantIds.forEach((id) => (result[id] = share));
  return result;
};

/** Validate split amounts sum to total */
export const validateSplit = (
  total: number,
  amounts: Record<string, number>
): boolean => {
  const sum = Object.values(amounts).reduce((a, b) => a + b, 0);
  return Math.abs(sum - total) < 0.01;
};

/** Calculate net balance for user across expenses */
export const calculateTotalBalance = (
  userId: string,
  expenses: any[]
): { totalOwed: number; totalOwing: number; netBalance: number } => {
  let totalOwed = 0;
  let totalOwing = 0;

  expenses.forEach((expense) => {
    const uid = (u: any) => (typeof u === 'object' ? u?._id || u?.id : u);

    const userPaid = expense.payers?.find(
      (p: any) => uid(p.user_id) === userId
    );

    // Money owed TO you
    if (userPaid) {
      expense.splits?.forEach((s: any) => {
        if (uid(s.user_id) !== userId && !s.settled) {
          totalOwed += s.amount_owed;
        }
      });
    }

    // Money YOU owe
    const userSplit = expense.splits?.find(
      (s: any) => uid(s.user_id) === userId && !s.settled
    );
    if (userSplit && !userPaid) {
      totalOwing += userSplit.amount_owed;
    }
  });

  return {
    totalOwed: parseFloat(totalOwed.toFixed(2)),
    totalOwing: parseFloat(totalOwing.toFixed(2)),
    netBalance: parseFloat((totalOwed - totalOwing).toFixed(2)),
  };
};

/** Simplify debts using min-transactions approach */
export const simplifyDebts = (
  balances: Balance[]
): { from: string; to: string; amount: number }[] => {
  const transactions: { from: string; to: string; amount: number }[] = [];
  const creditors = balances.filter((b) => b.amount > 0).map((b) => ({ ...b }));
  const debtors = balances
    .filter((b) => b.amount < 0)
    .map((b) => ({ ...b, amount: Math.abs(b.amount) }));

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].amount, debtors[j].amount);
    transactions.push({
      from: debtors[j].user_id,
      to: creditors[i].user_id,
      amount: parseFloat(amount.toFixed(2)),
    });
    creditors[i].amount -= amount;
    debtors[j].amount -= amount;
    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return transactions;
};

export const roundToTwo = (num: number): number =>
  Math.round(num * 100) / 100;
