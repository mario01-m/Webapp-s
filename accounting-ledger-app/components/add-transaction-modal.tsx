import { Modal, View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { useState, useEffect } from "react";
import { dateToInputFormat, inputFormatToDate } from "@/lib/app-utils";

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
  transactionId?: string;
}

export function AddTransactionModal({
  visible,
  onClose,
  onSuccess,
  accountId,
  transactionId,
}: AddTransactionModalProps) {
  const colors = useColors();
  const { addTransaction, updateTransaction, getTransaction } = useAppContext();

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (transactionId && visible) {
      const transaction = getTransaction(transactionId);
      if (transaction) {
        setDate(dateToInputFormat(transaction.date));
        setAmount(Math.abs(transaction.amount).toString());
        setType(transaction.type);
        setDescription(transaction.description);
      }
    } else {
      setDate(dateToInputFormat(new Date()));
      setAmount("");
      setType("income");
      setDescription("");
      setError("");
    }
  }, [visible, transactionId]);

  const handleSave = async () => {
    try {
      setError("");

      if (!date) {
        setError("يرجى اختيار التاريخ");
        return;
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("يرجى إدخال مبلغ صحيح");
        return;
      }

      setLoading(true);

      const finalAmount = type === "expense" ? -Math.abs(amountNum) : Math.abs(amountNum);

      if (transactionId) {
        const transaction = getTransaction(transactionId);
        if (transaction) {
          await updateTransaction({
            ...transaction,
            date: inputFormatToDate(date),
            amount: finalAmount,
            type,
            description: description.trim(),
          });
        }
      } else {
        await addTransaction({
          accountId,
          date: inputFormatToDate(date),
          amount: finalAmount,
          type,
          description: description.trim(),
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
                {transactionId ? "تعديل المعاملة" : "معاملة جديدة"}
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

            {/* Date */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                التاريخ
              </Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
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

            {/* Amount */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                المبلغ
              </Text>
              <TextInput
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
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

            {/* Type */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                النوع
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setType("income")}
                  disabled={loading}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor:
                        type === "income" ? colors.success : colors.surface,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        type === "income" ? colors.success : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    className="text-center font-semibold"
                    style={{
                      color:
                        type === "income"
                          ? colors.background
                          : colors.foreground,
                    }}
                  >
                    دخل
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setType("expense")}
                  disabled={loading}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor:
                        type === "expense" ? colors.error : colors.surface,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        type === "expense" ? colors.error : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    className="text-center font-semibold"
                    style={{
                      color:
                        type === "expense"
                          ? colors.background
                          : colors.foreground,
                    }}
                  >
                    مصروف
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                الوصف (اختياري)
              </Text>
              <TextInput
                placeholder="أضف وصفاً للمعاملة"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!loading}
                style={{
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlignVertical: "top",
                }}
                placeholderTextColor={colors.muted}
              />
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
