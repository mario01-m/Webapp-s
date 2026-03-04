import { ScrollView, Text, View, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { formatNumber } from "@/lib/app-utils";
import { useColors } from "@/hooks/use-colors";
import { router } from "expo-router";
import { useState } from "react";

/**
 * Home Screen - Display all accounts with summary
 */
export default function HomeScreen() {
  const colors = useColors();
  const { accounts, loading, getTotalBalance, getTotalIncome, getTotalExpense } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  const totalBalance = getTotalBalance();
  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAddAccount = () => {
    // Navigate to add account - will be implemented
    console.log('Add account');
  };

  const handleAccountPress = (accountId: string) => {
    // Navigate to account detail - will be implemented
    console.log('View account:', accountId);
  };

  const renderAccountCard = ({ item }: { item: any }) => {
    const isPositive = item.balance >= 0;
    const balanceColor = isPositive ? colors.success : colors.error;

    return (
      <Pressable
        onPress={() => handleAccountPress(item.id)}
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderRightWidth: 4,
            borderRightColor: colors.primary,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground mb-2">
              {item.name}
            </Text>
            <Text className="text-sm text-muted">
              {new Date(item.createdAt).toLocaleDateString("ar-SA")}
            </Text>
          </View>
          <View className="items-end">
            <Text
              className="text-xl font-bold"
              style={{ color: balanceColor }}
            >
              {formatNumber(item.balance)}
            </Text>
            <Text className="text-xs text-muted mt-1">ريال</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-center text-muted mt-4">جاري تحميل البيانات...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            دفتر الحسابات
          </Text>
          <Text className="text-sm text-muted">
            إدارة حساباتك ومعاملاتك المالية
          </Text>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-6">
          <View
            className="flex-1 rounded-lg p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs text-muted mb-2">الرصيد الإجمالي</Text>
            <Text
              className="text-lg font-bold"
              style={{ color: colors.primary }}
            >
              {formatNumber(totalBalance)}
            </Text>
          </View>

          <View
            className="flex-1 rounded-lg p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs text-muted mb-2">الدخل</Text>
            <Text
              className="text-lg font-bold"
              style={{ color: colors.success }}
            >
              {formatNumber(totalIncome)}
            </Text>
          </View>

          <View
            className="flex-1 rounded-lg p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs text-muted mb-2">المصروفات</Text>
            <Text
              className="text-lg font-bold"
              style={{ color: colors.error }}
            >
              {formatNumber(totalExpense)}
            </Text>
          </View>
        </View>

        {/* Accounts Section */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-foreground">
              الحسابات ({accounts.length})
            </Text>
            <Pressable
              onPress={handleAddAccount}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-white font-semibold text-sm">+ جديد</Text>
            </Pressable>
          </View>

          {accounts.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">
                لا توجد حسابات
              </Text>
              <Text className="text-sm text-muted text-center mb-4">
                ابدأ بإنشاء حساب جديد لتتمكن من تسجيل معاملاتك
              </Text>
              <Pressable
                onPress={handleAddAccount}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white font-semibold">
                  إنشاء حساب جديد
                </Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={accounts}
              renderItem={renderAccountCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
