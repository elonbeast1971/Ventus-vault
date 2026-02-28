import { useState, useCallback } from "react";
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
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { cryptoAssets, giftCards, type CryptoAsset, type GiftCard } from "@/lib/crypto-data";
import { addTransaction, updateUser, getUser } from "@/lib/storage";
import * as Crypto from "expo-crypto";

const C = Colors.dark;

type TradeTab = "crypto" | "giftcards";

function CryptoTradeCard({ asset }: { asset: CryptoAsset }) {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("buy");

  const ngnValue = parseFloat(amount || "0") * asset.ngnRate;

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const usdAmount = parseFloat(amount);
    const nairaAmount = usdAmount * asset.ngnRate;

    await addTransaction({
      id: Crypto.randomUUID(),
      type: action === "buy" ? "crypto_buy" : "crypto_sell",
      title: `${asset.symbol} ${action === "buy" ? "Bought" : "Sold"} $${usdAmount}`,
      amount: action === "buy" ? -nairaAmount : nairaAmount,
      status: "completed",
      timestamp: new Date().toISOString(),
      details: asset.name,
    });

    const user = await getUser();
    await updateUser({
      walletBalance: action === "buy" ? user.walletBalance - nairaAmount : user.walletBalance + nairaAmount,
      totalTrades: user.totalTrades + 1,
    });

    Alert.alert("Trade Successful", `${action === "buy" ? "Bought" : "Sold"} $${usdAmount} of ${asset.symbol} for ${formatNaira(nairaAmount)}`);
    setAmount("");
    setExpanded(false);
  };

  return (
    <View style={styles.tradeCard}>
      <Pressable
        style={styles.tradeCardHeader}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(!expanded);
        }}
      >
        <View style={styles.tradeCardLeft}>
          <View style={[styles.assetIcon, { backgroundColor: asset.color + "20" }]}>
            <Ionicons name={asset.icon as any} size={22} color={asset.color} />
          </View>
          <View>
            <Text style={styles.assetName}>{asset.name}</Text>
            <Text style={styles.assetSymbol}>{asset.symbol}</Text>
          </View>
        </View>
        <View style={styles.tradeCardRight}>
          <Text style={styles.assetPrice}>${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
          <View style={[styles.changePill, { backgroundColor: asset.change24h >= 0 ? C.accentMuted : C.dangerMuted }]}>
            <Ionicons name={asset.change24h >= 0 ? "arrow-up" : "arrow-down"} size={10} color={asset.change24h >= 0 ? C.accent : C.danger} />
            <Text style={[styles.changeVal, { color: asset.change24h >= 0 ? C.accent : C.danger }]}>
              {Math.abs(asset.change24h).toFixed(2)}%
            </Text>
          </View>
        </View>
      </Pressable>

      {expanded && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.expandedSection}>
          <View style={styles.rateInfo}>
            <Text style={styles.rateLabel}>Rate: N{asset.ngnRate.toLocaleString()} / $1</Text>
          </View>

          <View style={styles.actionToggle}>
            <Pressable
              style={[styles.toggleBtn, action === "buy" && styles.toggleBtnActive]}
              onPress={() => setAction("buy")}
            >
              <Text style={[styles.toggleText, action === "buy" && styles.toggleTextActive]}>Buy</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, action === "sell" && styles.toggleBtnSell]}
              onPress={() => setAction("sell")}
            >
              <Text style={[styles.toggleText, action === "sell" && styles.toggleTextSell]}>Sell</Text>
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={C.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {ngnValue > 0 && (
            <Text style={styles.ngnPreview}>
              You {action === "buy" ? "pay" : "receive"}: {formatNaira(ngnValue)}
            </Text>
          )}

          <Pressable
            style={[styles.tradeBtn, { backgroundColor: action === "buy" ? C.accent : C.primary }]}
            onPress={handleTrade}
          >
            <Text style={styles.tradeBtnText}>
              {action === "buy" ? "Buy" : "Sell"} {asset.symbol}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

function GiftCardItem({ card }: { card: GiftCard }) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");

  const ngnValue = parseFloat(amount || "0") * card.rate;

  const handleSell = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const usdAmount = parseFloat(amount);
    const nairaAmount = usdAmount * card.rate;

    await addTransaction({
      id: Crypto.randomUUID(),
      type: "gift_card",
      title: `${card.name} $${usdAmount} Sold`,
      amount: nairaAmount,
      status: "pending",
      timestamp: new Date().toISOString(),
      details: `${card.name} Gift Card`,
    });

    const user = await getUser();
    await updateUser({
      walletBalance: user.walletBalance + nairaAmount,
      totalTrades: user.totalTrades + 1,
    });

    Alert.alert("Trade Submitted", `${card.name} $${usdAmount} submitted for processing.\nEstimated payout: ${formatNaira(nairaAmount)}`);
    setAmount("");
    setShowModal(false);
  };

  return (
    <>
      <Pressable
        style={styles.giftCardItem}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowModal(true);
        }}
      >
        <View style={[styles.gcIcon, { backgroundColor: card.color + "20" }]}>
          <Ionicons name={card.icon as any} size={22} color={card.color} />
        </View>
        <View style={styles.gcInfo}>
          <Text style={styles.gcName}>{card.name}</Text>
          <Text style={styles.gcRate}>N{card.rate}/$1</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
      </Pressable>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sell {card.name}</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.gcModalIcon, { backgroundColor: card.color + "20" }]}>
                <Ionicons name={card.icon as any} size={36} color={card.color} />
              </View>

              <View style={styles.rateInfo}>
                <Text style={styles.rateLabel}>Rate: N{card.rate}/$1</Text>
              </View>

              <Text style={styles.inputLabel}>Card Amount (USD)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={C.textTertiary}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <Text style={styles.rangeText}>
                Min: ${card.minAmount} - Max: ${card.maxAmount}
              </Text>

              {ngnValue > 0 && (
                <View style={styles.payoutPreview}>
                  <Text style={styles.payoutLabel}>You receive</Text>
                  <Text style={styles.payoutAmount}>{formatNaira(ngnValue)}</Text>
                </View>
              )}

              <Pressable style={styles.sellBtn} onPress={handleSell}>
                <Text style={styles.sellBtnText}>Sell Gift Card</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function formatNaira(amount: number): string {
  const abs = Math.abs(amount);
  return (amount < 0 ? "-" : "") + "N" + abs.toLocaleString("en-NG");
}

export default function TradeScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TradeTab>("crypto");
  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Trade</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabBtn, tab === "crypto" && styles.tabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab("crypto");
          }}
        >
          <Ionicons name="logo-bitcoin" size={16} color={tab === "crypto" ? C.background : C.textSecondary} />
          <Text style={[styles.tabText, tab === "crypto" && styles.tabTextActive]}>Crypto</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === "giftcards" && styles.tabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab("giftcards");
          }}
        >
          <Ionicons name="card" size={16} color={tab === "giftcards" ? C.background : C.textSecondary} />
          <Text style={[styles.tabText, tab === "giftcards" && styles.tabTextActive]}>Gift Cards</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tab === "crypto" ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            {cryptoAssets.map((asset) => (
              <CryptoTradeCard key={asset.id} asset={asset} />
            ))}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.gcList}>
              {giftCards.map((card) => (
                <GiftCardItem key={card.id} card={card} />
              ))}
            </View>
          </Animated.View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 20 },
  pageHeader: { paddingHorizontal: 20, paddingBottom: 8, marginTop: 12 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: C.text, fontFamily: "DMSans_700Bold" },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 20, marginTop: 8 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border },
  tabBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: C.textSecondary, fontFamily: "DMSans_600SemiBold" },
  tabTextActive: { color: C.background },
  tradeCard: { backgroundColor: C.cardBg, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  tradeCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  tradeCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  assetIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  assetName: { fontSize: 16, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  assetSymbol: { fontSize: 12, color: C.textSecondary, marginTop: 1, fontFamily: "DMSans_400Regular" },
  tradeCardRight: { alignItems: "flex-end" },
  assetPrice: { fontSize: 16, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  changePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  changeVal: { fontSize: 11, fontWeight: "600", fontFamily: "DMSans_600SemiBold" },
  expandedSection: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: C.borderLight },
  rateInfo: { backgroundColor: C.primaryMuted, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 12, marginBottom: 12, alignSelf: "flex-start" },
  rateLabel: { fontSize: 13, fontWeight: "600", color: C.primary, fontFamily: "DMSans_600SemiBold" },
  actionToggle: { flexDirection: "row", backgroundColor: C.background, borderRadius: 12, padding: 3, marginBottom: 14 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  toggleBtnActive: { backgroundColor: C.accentMuted },
  toggleBtnSell: { backgroundColor: C.primaryMuted },
  toggleText: { fontSize: 14, fontWeight: "600", color: C.textSecondary, fontFamily: "DMSans_600SemiBold" },
  toggleTextActive: { color: C.accent },
  toggleTextSell: { color: C.primary },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.background, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: C.border },
  inputPrefix: { fontSize: 20, fontWeight: "700", color: C.primary, marginRight: 8, fontFamily: "DMSans_700Bold" },
  amountInput: { flex: 1, fontSize: 24, fontWeight: "700", color: C.text, paddingVertical: 14, fontFamily: "DMSans_700Bold" },
  ngnPreview: { fontSize: 14, color: C.accent, marginTop: 10, fontFamily: "DMSans_600SemiBold" },
  tradeBtn: { marginTop: 14, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  tradeBtnText: { fontSize: 16, fontWeight: "700", color: "#000", fontFamily: "DMSans_700Bold" },
  gcList: { backgroundColor: C.cardBg, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  giftCardItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  gcIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
  gcInfo: { flex: 1 },
  gcName: { fontSize: 16, fontWeight: "600", color: C.text, fontFamily: "DMSans_600SemiBold" },
  gcRate: { fontSize: 13, color: C.accent, marginTop: 2, fontFamily: "DMSans_400Regular" },
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 20, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  modalBody: { padding: 20 },
  gcModalIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
  inputLabel: { fontSize: 14, color: C.textSecondary, marginBottom: 8, fontFamily: "DMSans_400Regular" },
  rangeText: { fontSize: 12, color: C.textTertiary, marginTop: 8, fontFamily: "DMSans_400Regular" },
  payoutPreview: { backgroundColor: C.accentMuted, borderRadius: 14, padding: 16, marginTop: 16, alignItems: "center" },
  payoutLabel: { fontSize: 13, color: C.accent, fontFamily: "DMSans_400Regular" },
  payoutAmount: { fontSize: 28, fontWeight: "800", color: C.accent, marginTop: 4, fontFamily: "DMSans_700Bold" },
  sellBtn: { backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 20 },
  sellBtnText: { fontSize: 16, fontWeight: "700", color: "#000", fontFamily: "DMSans_700Bold" },
});
