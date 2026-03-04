import { Modal, View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { useState, useEffect } from "react";
import { generateId } from "@/lib/app-utils";

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId?: string;
}

export function AddAccountModal({
  visible,
  onClose,
  onSuccess,
  accountId,
}: AddAccountModalProps) {
  const colors = useColors();
  const { addAccount, updateAccount, getAccount, categories } = useAppContext();

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (accountId && visible) {
      const account = getAccount(accountId);
      if (account) {
        setName(account.name);
        setBalance(account.balance.toString());
        setCategoryId(account.categoryId);
      }
    } else {
      setName("");
      setBalance("");
      setCategoryId(categories[0]?.id || "");
      setError("");
    }
  }, [visible, accountId]);

  const handleSave = async () => {
    try {
      setError("");

      if (!name.trim()) {
        setError("يرجى إدخال اسم الحساب");
        return;
      }

      const balanceNum = parseFloat(balance) || 0;

      setLoading(true);

      if (accountId) {
        const account = getAccount(accountId);
        if (account) {
          await updateAccount({
            ...account,
            name: name.trim(),
            balance: balanceNum,
            categoryId: categoryId || categories[0]?.id || "",
          });
        }
      } else {
        await addAccount({
          name: name.trim(),
          balance: balanceNum,
          categoryId: categoryId || categories[0]?.id || "",
        });
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <View
          className="flex-1 rounded-t-3xl p-6 mt-auto"
          style={{ backgroundColor: colors.background }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="mb-6">
              <Text className="text-2xl font-bold text-foreground">
                {accountId ? "تعديل الحساب" : "حساب جديد"}
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View
                className="p-3 rounded-lg mb-4"
                style={{ backgroundColor: colors.error + "20" }}
              >
                <Text style={{ color: colors.error }}>{error}</Text>
              </View>
            ) : null}

            {/* Account Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                اسم الحساب
              </Text>
              <TextInput
                placeholder="مثال: حسابي الشخصي"
                value={name}
                onChangeText={setName}
                editable={!loading}
                style={{
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Initial Balance */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                الرصيد الأولي
              </Text>
              <TextInput
                placeholder="0.00"
                value={balance}
                onChangeText={setBalance}
                keyboardType="decimal-pad"
                editable={!loading}
                style={{
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Category */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                التصنيف
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="gap-2"
              >
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    disabled={loading}
                    style={({ pressed }) => [
                      {
                        backgroundColor:
                          categoryId === category.id
                            ? colors.primary
                            : colors.surface,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor:
                          categoryId === category.id
                            ? colors.primary
                            : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          categoryId === category.id
                            ? colors.background
                            : colors.foreground,
                      }}
                      className="font-medium"
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.surface,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-center font-semibold text-foreground">
                  إلغاء
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={loading}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-center font-semibold text-white">
                  {loading ? "جاري الحفظ..." : "حفظ"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
