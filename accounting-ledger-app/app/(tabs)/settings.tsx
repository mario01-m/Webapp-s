import { ScrollView, Text, View, Pressable, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

/**
 * Settings Screen - App configuration and data management
 */
export default function SettingsScreen() {
  const colors = useColors();
  const { exportData, importData, clearAllData, accounts, transactions } =
    useAppContext();
  const [loading, setLoading] = useState(false);

  const handleExportData = async () => {
    try {
      setLoading(true);
      const data = await exportData();
      const filename = `accounting-ledger-${new Date().toISOString().split("T")[0]}.json`;
      const filepath = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${filename}` : filename;

      await FileSystem.writeAsStringAsync(filepath, JSON.stringify(data, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filepath, {
          mimeType: "application/json",
          dialogTitle: "تصدير البيانات",
          UTI: "com.example.json",
        });
      } else {
        Alert.alert("نجح", "تم تصدير البيانات بنجاح");
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل تصدير البيانات");
      console.error("Export error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });

      if (!result.canceled && result.assets[0]) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const data = JSON.parse(content);
        await importData(data);
        Alert.alert("نجح", "تم استيراد البيانات بنجاح");
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل استيراد البيانات");
      console.error("Import error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      "تحذير",
      "هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذه العملية.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف جميع البيانات",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await clearAllData();
              Alert.alert("نجح", "تم حذف جميع البيانات");
            } catch (error) {
              Alert.alert("خطأ", "فشل حذف البيانات");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const SettingButton = ({
    title,
    subtitle,
    onPress,
    variant = "default",
  }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    variant?: "default" | "danger";
  }) => {
    const bgColor =
      variant === "danger"
        ? colors.error + "10"
        : colors.surface;
    const textColor =
      variant === "danger" ? colors.error : colors.foreground;

    return (
      <Pressable
        onPress={onPress}
        disabled={loading}
        style={({ pressed }) => [
          {
            backgroundColor: bgColor,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor:
              variant === "danger" ? colors.error + "30" : colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text className="font-semibold text-lg" style={{ color: textColor }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-muted mt-1">{subtitle}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            الإعدادات
          </Text>
          <Text className="text-sm text-muted">
            إدارة البيانات والإعدادات
          </Text>
        </View>

        {/* Statistics */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            الإحصائيات
          </Text>
          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-lg p-4"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-xs text-muted mb-2">الحسابات</Text>
              <Text className="text-2xl font-bold text-primary">
                {accounts.length}
              </Text>
            </View>
            <View
              className="flex-1 rounded-lg p-4"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-xs text-muted mb-2">المعاملات</Text>
              <Text className="text-2xl font-bold text-primary">
                {transactions.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            إدارة البيانات
          </Text>

          <SettingButton
            title="تصدير البيانات"
            subtitle="حفظ نسخة من بيانات التطبيق"
            onPress={handleExportData}
          />

          <SettingButton
            title="استيراد البيانات"
            subtitle="استعادة بيانات من ملف محفوظ"
            onPress={handleImportData}
          />

          <SettingButton
            title="حذف جميع البيانات"
            subtitle="حذف جميع الحسابات والمعاملات"
            onPress={handleClearAllData}
            variant="danger"
          />
        </View>

        {/* About */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            حول التطبيق
          </Text>
          <View
            className="rounded-lg p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="mb-3">
              <Text className="text-xs text-muted mb-1">اسم التطبيق</Text>
              <Text className="text-base font-semibold text-foreground">
                دفتر الحسابات
              </Text>
            </View>
            <View className="mb-3">
              <Text className="text-xs text-muted mb-1">الإصدار</Text>
              <Text className="text-base font-semibold text-foreground">
                1.0.0
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted mb-1">الوصف</Text>
              <Text className="text-sm text-foreground">
                تطبيق شامل لإدارة الحسابات والمعاملات المالية مع تخزين محلي آمن
              </Text>
            </View>
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-center text-muted mt-2">
              جاري المعالجة...
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
