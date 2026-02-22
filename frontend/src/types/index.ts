// ======================== User ========================
export interface User {
  id: string;
  _id?: string;
  email: string;
  phone?: string;
  username?: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

// ======================== Friendship ========================
export interface Friendship {
  id: string;
  _id?: string;
  user_id_1: string | User;
  user_id_2: string | User;
  status: 'pending' | 'accepted' | 'blocked';
  requested_by: string;
  created_at: string;
  updated_at: string;
}

// ======================== Group ========================
export interface GroupMember {
  user_id: string | User;
  joined_at: string;
  _id?: string;
}

export interface Group {
  id: string;
  _id?: string;
  name: string;
  type: 'home' | 'trip' | 'couple' | 'other';
  image_url?: string;
  currency: string;
  created_by: string;
  simplify_debts: boolean;
  members: GroupMember[];
  created_at: string;
  updated_at: string;
}

// ======================== Expense ========================
export interface ExpensePayer {
  user_id: string | User;
  amount_paid: number;
  _id?: string;
}

export interface ExpenseSplit {
  user_id: string | User;
  amount_owed: number;
  settled: boolean;
  settled_at?: string;
  _id?: string;
}

export interface Expense {
  id: string;
  _id?: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  group_id?: string | { _id: string; name: string };
  receipt_url?: string;
  notes?: string;
  created_by: string | User;
  payers: ExpensePayer[];
  splits: ExpenseSplit[];
  created_at: string;
  updated_at: string;
}

export type SplitMethod = 'equal' | 'unequal' | 'percentage' | 'shares';

// ======================== Settlement ========================
export interface Settlement {
  id: string;
  _id?: string;
  from_user_id: string | User;
  to_user_id: string | User;
  amount: number;
  currency: string;
  payment_method?: string;
  group_id?: string | { _id: string; name: string };
  notes?: string;
  created_at: string;
}

// ======================== Notification ========================
export interface Notification {
  id: string;
  _id?: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

// ======================== Comment ========================
export interface Comment {
  id: string;
  _id?: string;
  expense_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user?: User;
}

// ======================== Balance Helpers ========================
export interface Balance {
  user_id: string;
  amount: number;
  currency: string;
  user?: User;
}

// ======================== Navigation ========================
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  AddExpense: { groupId?: string };
  ExpenseDetail: { expenseId: string };
  SettleUp: { userId: string; userName: string; amount: number; groupId?: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Friends: undefined;
  Groups: undefined;
  Activity: undefined;
  Account: undefined;
};
