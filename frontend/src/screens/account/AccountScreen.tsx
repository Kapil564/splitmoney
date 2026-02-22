import React, { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authAPI } from '../../services/api';

export const AccountScreen = () => {
  const { user, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile updated!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Toast.show({ type: 'error', text1: 'Please fill in both fields' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'New password must be at least 6 characters' });
      return;
    }
    setChangingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      Toast.show({ type: 'success', text1: 'Password changed!' });
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Account</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar name={fullName} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => { setEditing(!editing); setFirstName(user.first_name); setLastName(user.last_name); setPhone(user.phone || ''); }}
          >
            <MaterialCommunityIcons
              name={editing ? 'close' : 'pencil'}
              size={18}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Edit Form */}
        {editing && (
          <View style={styles.editSection}>
            <View style={styles.row}>
              <View style={styles.half}>
                <Input label="First Name" value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={styles.half}>
                <Input label="Last Name" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
            <Input label="Phone" placeholder="Optional" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Button title="Save Changes" onPress={handleSave} loading={saving} />
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menu}>
          <Text style={styles.menuHeader}>Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#5B9BD522' }]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#5B9BD5" />
            </View>
            <Text style={styles.menuLabel}>Change Password</Text>
            <MaterialCommunityIcons
              name={showChangePassword ? 'chevron-up' : 'chevron-right'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.changePasswordSection}>
              <Input
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
              <Input
                label="New Password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Button title="Update Password" onPress={handleChangePassword} loading={changingPassword} size="small" />
            </View>
          )}

          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#FF704322' }]}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#FF7043" />
            </View>
            <Text style={styles.menuLabel}>Default Currency</Text>
            <Text style={styles.menuValue}>{user.default_currency}</Text>
          </View>

          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#AB47BC22' }]}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#AB47BC" />
            </View>
            <Text style={styles.menuLabel}>App Version</Text>
            <Text style={styles.menuValue}>2.0.0</Text>
          </View>
        </View>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          size="large"
          style={styles.signOutBtn}
          icon={<MaterialCommunityIcons name="logout" size={18} color={colors.white} />}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 24 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 16,
  },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 18, fontWeight: '700', color: colors.text },
  profileEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  editBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center',
  },
  editSection: {
    backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 16,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  menu: { marginBottom: 24 },
  menuHeader: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 12, marginLeft: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  menuValue: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  changePasswordSection: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 8,
  },
  signOutBtn: { marginTop: 8 },
});
