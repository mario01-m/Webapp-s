import {
  ScrollView,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { formatNumber, formatDate } from "@/lib/app-utils";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { AddAccountModal } from "@/components/add-account-modal";
import { AddTransactionModal } from "@/components/add-transaction-modal";

/**
 * Accounts Screen - Manage accounts and transactions
 */
export default function AccountsScreen() {
  const colors = useColors();
  const {
    accounts,
    loading,
    getAccountTransactions,
    deleteAccount,
    deleteTransaction,
  } = useAppContext();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );

  const selectedAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)
    : null;
  const transactions = selectedAccountId
    ? getAccountTransactions(selectedAccountId)
    : [];

  const handleAddAccount = () => {
    setEditingAccountId(null);
    setShowAddAccountModal(true);
  };

  const handleEditAccount = (accountId: string) => {
    setEditingAccountId(accountId);
    setShowAddAccountModal(true);
  };

  const handleDeleteAccount = (accountId: string) => {
    Alert.alert(
      "حذف الحساب",
      "هل أنت متأكد من حذف هذا الحساب؟ سيتم حذف جميع المعاملات المرتبطة به.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount(accountId);
              setSelectedAccountId(null);
            } catch (error) {
              Alert.alert("خطأ", "فشل حذف الحساب");
            }
          },
        },
      ]
    );
  };

  const handleAddTransaction = () => {
    if (!selectedAccountId) return;
    setEditingTransactionId(null);
    setShowAddTransactionModal(true);
  };

  const handleEditTransaction = (transactionId: string) => {
    setEditingTransactionId(transactionId);
    setShowAddTransactionModal(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      "حذف المعاملة",
      "هل أنت متأكد من حذف هذه المعاملة؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
            } catch (error) {
              Alert.alert("خطأ", "فشل حذف المعاملة");
            }
          },
        },
      ]
    );
  };

  const renderTransactionItem = ({ item }: { item: any }) => {
    const isIncome = item.amount > 0;
    const amountColor = isIncome ? colors.success : colors.error;

    return (
      <Pressable
        onLongPress={() => handleEditTransaction(item.id)}
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View className="flex-1">
          <Text className="font-semibold text-foreground">
            {item.description}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {formatDate(item.date)}
          </Text>
        </View>
        <Text className="font-bold text-lg" style={{ color: amountColor }}>
          {isIncome ? "+" : ""}{formatNumber(item.amount)}
        </Text>
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
      {!selectedAccount ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-2xl font-bold text-foreground">
                الحسابات
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
          </View>

          {/* Accounts List */}
          {accounts.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">
                لا توجد حسابات
              </Text>
              <Text className="text-sm text-muted text-center mb-4">
                ابدأ بإنشاء حساب جديد
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
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedAccountId(item.id)}
                  onLongPress={() => handleEditAccount(item.id)}
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
                      <Text className="text-lg font-semibold text-foreground">
                        {item.name}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {getAccountTransactions(item.id).length} معاملات
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text
                        className="text-xl font-bold"
                        style={{
                          color:
                            item.balance >= 0
                              ? colors.success
                              : colors.error,
                        }}
                      >
                        {formatNumber(item.balance)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          )}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Account Header */}
          <View className="mb-6">
            <Pressable
              onPress={() => setSelectedAccountId(null)}
              className="mb-4"
            >
              <Text className="text-lg text-primary font-semibold">
                ← العودة
              </Text>
            </Pressable>

            <View className="bg-gradient-to-r rounded-lg p-6" style={{ backgroundColor: colors.primary }}>
              <Text className="text-white text-lg mb-2">{selectedAccount.name}</Text>
              <Text className="text-white text-3xl font-bold">
                {formatNumber(selectedAccount.balance)}
              </Text>
            </View>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={handleAddTransaction}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 10,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-center text-white font-semibold text-sm">
                  + معاملة
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleEditAccount(selectedAccount.id)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.surface,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-center text-foreground font-semibold text-sm">
                  تعديل
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleDeleteAccount(selectedAccount.id)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.error + "20",
                    paddingVertical: 10,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-center text-error font-semibold text-sm">
                  حذف
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Transactions */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-4">
              المعاملات ({transactions.length})
            </Text>

            {transactions.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-3xl mb-2">📝</Text>
                <Text className="text-sm text-muted">لا توجد معاملات</Text>
              </View>
            ) : (
              <FlatList
                data={transactions.sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                nestedScrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      )}

      {/* Modals */}
      <AddAccountModal
        visible={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onSuccess={() => {}}
        accountId={editingAccountId || undefined}
      />

      {selectedAccountId && (
        <AddTransactionModal
          visible={showAddTransactionModal}
          onClose={() => setShowAddTransactionModal(false)}
          onSuccess={() => {}}
          accountId={selectedAccountId}
          transactionId={editingTransactionId || undefined}
        />
      )}
    </ScreenContainer>
  );
}
