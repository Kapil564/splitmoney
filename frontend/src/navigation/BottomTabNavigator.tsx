import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { colors } from '../constants/colors';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { FriendsListScreen } from '../screens/friends/FriendsListScreen';
import { GroupsListScreen } from '../screens/groups/GroupsListScreen';
import { ActivityFeedScreen } from '../screens/activity/ActivityFeedScreen';
import { AccountScreen } from '../screens/account/AccountScreen';
import { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['view-dashboard', 'view-dashboard-outline'],
            Friends: ['account-group', 'account-group-outline'],
            Groups: ['account-multiple', 'account-multiple-outline'],
            Activity: ['bell', 'bell-outline'],
            Account: ['account-circle', 'account-circle-outline'],
          };
          const [filledIcon, outlineIcon] = icons[route.name] || ['circle', 'circle-outline'];
          const iconName = focused ? filledIcon : outlineIcon;

          return (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <MaterialCommunityIcons name={iconName as any} size={24} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Friends" component={FriendsListScreen} />
      <Tab.Screen name="Groups" component={GroupsListScreen} />
      <Tab.Screen name="Activity" component={ActivityFeedScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  activeIconWrap: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
