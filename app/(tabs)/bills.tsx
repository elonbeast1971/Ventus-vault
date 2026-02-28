import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { billCategories, networks } from "@/lib/crypto-data";
import { addTransaction, updateUser, getUser } from "@/lib/storage";
import * as Crypto from "expo-crypto";

const C = Colors.dark;

const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const webTop = Platform.OS === "web" ? 67 : 0;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handlePurchase = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0 || !phone) {
      Alert.alert("Missing Info", "Please enter a valid phone number and amount");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const cat = billCategories.find(c => c.id === selectedCategory);
    await addTransaction({
      id: Crypto.randomUUID(),
      type: selectedCategory === "airtime" || selectedCategory === "data" ? "airtime" : "bill",
      title: `${cat?.name || "Bill"} - ${selectedNetwork?.toUpperCase() || ""}`,
      amount: -amountNum,
      status: "completed",
      timestamp: new Date().toISOString(),
      details: phone,
    });

    const user = await getUser();
    await updateUser({ walletBalance: user.walletBalance - amountNum });

    Alert.alert(
      "Payment Successful",
      `${cat?.name} of N${amountNum.toLocaleString()} sent to ${phone}`,
      [{ text: "Done", onPress: () => { setShowModal(false); setAmount(""); setPhone(""); } }]
    );
  };

  const openCategory = (catId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(catId);
    setSelectedNetwork(null);
    setAmount("");
    setPhone("");
    setShowModal(true);
  };

  const needsNetwork = selectedCategory === "airtime" || selectedCategory === "data";

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Bills & Airtime</Text>
        <Text style={styles.pageSubtitle}>Pay bills directly from your wallet</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.categoryGrid}>
            {billCategories.map((cat, index) => (
              <Animated.View key={cat.id} entering={FadeInDown.duration(400).delay(index * 80)} style={styles.categoryWrapper}>
                <Pressable
                  style={styles.categoryCard}
                  onPress={() => openCategory(cat.id)}
                >
                  <View style={[styles.catIcon, { backgroundColor: cat.color + "20" }]}>
                    <Ionicons name={cat.icon as any} size={28} color={cat.color} />
                  </View>
                  <Text style={styles.catName}>{cat.name}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <View style={styles.promoCard}>
            <View style={styles.promoContent}>
              <Ionicons name="flash" size={24} color={C.primary} />
              <View style={styles.promoText}>
                <Text style={styles.promoTitle}>Instant Processing</Text>
                <Text style={styles.promoDesc}>All bill payments are processed instantly with zero extra charges</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          <View style={styles.recentList}>
            {[
              { name: "MTN Airtime", phone: "0812****789", amount: "N2,000", icon: "call", color: "#FFCC00" },
              { name: "DSTV Premium", phone: "100****234", amount: "N24,500", icon: "tv", color: "#FC3C44" },
              { name: "IKEDC Prepaid", phone: "5400****012", amount: "N15,000", icon: "flash", color: "#F7931A" },
            ].map((item, i) => (
              <Pressable key={i} style={styles.recentItem}>
                <View style={[styles.recentIcon, { backgroundColor: item.color + "20" }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{item.name}</Text>
                  <Text style={styles.recentPhone}>{item.phone}</Text>
                </View>
                <Text style={styles.recentAmount}>{item.amount}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {billCategories.find(c => c.id === selectedCategory)?.name || "Pay Bill"}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {needsNetwork && (
                <>
                  <Text style={styles.fieldLabel}>Select Network</Text>
                  <View style={styles.networkGrid}>
                    {networks.map((net) => (
                      <Pressable
                        key={net.id}
                        style={[
                          styles.networkBtn,
                          selectedNetwork === net.id && { borderColor: net.color, backgroundColor: net.color + "15" },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedNetwork(net.id);
                        }}
                      >
                        <Text style={[styles.networkName, selectedNetwork === net.id && { color: net.color }]}>
                          {net.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.fieldLabel}>
                {needsNetwork ? "Phone Number" : "Meter/Smart Card Number"}
              </Text>
              <View style={styles.fieldInput}>
                <Ionicons name={needsNetwork ? "call-outline" : "keypad-outline"} size={18} color={C.textTertiary} />
                <TextInput
                  style={styles.fieldText}
                  placeholder={needsNetwork ? "0801 234 5678" : "Enter number"}
                  placeholderTextColor={C.textTertiary}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <Text style={styles.fieldLabel}>Amount</Text>
              <View style={styles.fieldInput}>
                <Text style={styles.nairaSign}>N</Text>
                <TextInput
                  style={styles.fieldText}
                  placeholder="0"
                  placeholderTextColor={C.textTertiary}
                  keyboardType="number-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {needsNetwork && (
                <View style={styles.quickAmounts}>
                  {quickAmounts.map((amt) => (
                    <Pressable
                      key={amt}
                      style={[styles.quickBtn, amount === String(amt) && styles.quickBtnActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAmount(String(amt));
                      }}
                    >
                      <Text style={[styles.quickBtnText, amount === String(amt) && styles.quickBtnTextActive]}>
                        N{amt.toLocaleString()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable style={styles.payBtn} onPress={handlePurchase}>
                <Ionicons name="flash" size={20} color="#000" />
                <Text style={styles.payBtnText}>Pay Now</Text>
              </Pressable>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 20 },
  pageHeader: { paddingHorizontal: 20, paddingBottom: 8, marginTop: 12 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: C.text, fontFamily: "DMSans_700Bold" },
  pageSubtitle: { fontSize: 14, color: C.textSecondary, marginTop: 4, fontFamily: "DMSans_400Regular" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 },
  categoryWrapper: { width: "47%" },
  categoryCard: { backgroundColor: C.cardBg, borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: C.border, gap: 12 },
  catIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  catName: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "DMSans_600SemiBold" },
  promoCard: { backgroundColor: C.primaryMuted, borderRadius: 16, padding: 18, marginTop: 20, borderWidth: 1, borderColor: C.primary + "30" },
  promoContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  promoText: { flex: 1 },
  promoTitle: { fontSize: 15, fontWeight: "700", color: C.primary, fontFamily: "DMSans_700Bold" },
  promoDesc: { fontSize: 13, color: C.textSecondary, marginTop: 4, fontFamily: "DMSans_400Regular" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginTop: 24, marginBottom: 14, fontFamily: "DMSans_700Bold" },
  recentList: { backgroundColor: C.cardBg, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  recentItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  recentIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "DMSans_600SemiBold" },
  recentPhone: { fontSize: 12, color: C.textTertiary, marginTop: 2, fontFamily: "DMSans_400Regular" },
  recentAmount: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "DMSans_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 20, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: C.textSecondary, marginBottom: 8, marginTop: 16, fontFamily: "DMSans_600SemiBold" },
  fieldInput: { flexDirection: "row", alignItems: "center", backgroundColor: C.background, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  fieldText: { flex: 1, fontSize: 16, color: C.text, paddingVertical: 14, fontFamily: "DMSans_600SemiBold" },
  nairaSign: { fontSize: 18, fontWeight: "700", color: C.primary, fontFamily: "DMSans_700Bold" },
  networkGrid: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  networkBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: C.background, borderWidth: 1.5, borderColor: C.border },
  networkName: { fontSize: 14, fontWeight: "600", color: C.textSecondary, fontFamily: "DMSans_600SemiBold" },
  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.background, borderWidth: 1, borderColor: C.border },
  quickBtnActive: { backgroundColor: C.primaryMuted, borderColor: C.primary },
  quickBtnText: { fontSize: 13, fontWeight: "600", color: C.textSecondary, fontFamily: "DMSans_600SemiBold" },
  quickBtnTextActive: { color: C.primary },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, marginTop: 24 },
  payBtnText: { fontSize: 16, fontWeight: "700", color: "#000", fontFamily: "DMSans_700Bold" },
});
