import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getUser, getTransactions, type UserProfile, type Transaction } from "@/lib/storage";
import { cryptoAssets } from "@/lib/crypto-data";

const C = Colors.dark;

function formatNaira(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1000000) return (amount < 0 ? "-" : "") + "N" + (abs / 1000000).toFixed(2) + "M";
  return (amount < 0 ? "-" : "") + "N" + abs.toLocaleString("en-NG");
}

function CryptoTicker({ asset, index }: { asset: typeof cryptoAssets[0]; index: number }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000 + index * 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000 + index * 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={styles.cryptoCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/trade");
        }}
      >
        <View style={[styles.cryptoIcon, { backgroundColor: asset.color + "20" }]}>
          <Ionicons name={asset.icon as any} size={20} color={asset.color} />
        </View>
        <Text style={styles.cryptoSymbol}>{asset.symbol}</Text>
        <Text style={styles.cryptoPrice}>${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <View style={[styles.changeBadge, { backgroundColor: asset.change24h >= 0 ? C.accentMuted : C.dangerMuted }]}>
          <Ionicons name={asset.change24h >= 0 ? "trending-up" : "trending-down"} size={12} color={asset.change24h >= 0 ? C.accent : C.danger} />
          <Text style={[styles.changeText, { color: asset.change24h >= 0 ? C.accent : C.danger }]}>
            {Math.abs(asset.change24h).toFixed(2)}%
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TransactionItem({ tx }: { tx: Transaction }) {
  const iconMap: Record<string, string> = {
    gift_card: "card",
    crypto_buy: "trending-up",
    crypto_sell: "trending-down",
    payout: "wallet",
    airtime: "call",
    bill: "receipt",
    reward: "star",
    referral: "people",
  };
  const colorMap: Record<string, string> = {
    gift_card: "#F7931A",
    crypto_buy: C.accent,
    crypto_sell: "#627EEA",
    payout: C.primary,
    airtime: "#00C853",
    bill: "#FC3C44",
    reward: "#9945FF",
    referral: C.primary,
  };
  const isPositive = tx.amount > 0;

  return (
    <Pressable style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: (colorMap[tx.type] || C.primary) + "20" }]}>
        <Ionicons name={(iconMap[tx.type] || "ellipse") as any} size={18} color={colorMap[tx.type] || C.primary} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
        <Text style={styles.txTime}>
          {new Date(tx.timestamp).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
          {tx.status === "pending" ? " - Pending" : ""}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: isPositive ? C.accent : C.text }]}>
        {isPositive ? "+" : ""}{formatNaira(tx.amount)}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const loadData = useCallback(async () => {
    const [u, txns] = await Promise.all([getUser(), getTransactions()]);
    setUser(u);
    setTransactions(txns);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name?.split(" ")[0] || "Trader"}</Text>
          </View>
          <Pressable
            style={styles.notifBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/profile");
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={C.text} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <LinearGradient
            colors={["#1A1520", "#2A1F35", "#1A1520"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <View style={styles.walletHeader}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBalanceVisible(!balanceVisible);
                }}
              >
                <Ionicons name={balanceVisible ? "eye-outline" : "eye-off-outline"} size={20} color={C.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.walletBalance}>
              {balanceVisible ? formatNaira(user?.walletBalance || 0) : "N***,***"}
            </Text>
            <View style={styles.walletTier}>
              <View style={[styles.tierBadge, { backgroundColor: C.primaryMuted }]}>
                <Ionicons name="shield-checkmark" size={12} color={C.primary} />
                <Text style={styles.tierText}>{user?.tier?.toUpperCase() || "VIP"} Trader</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              {[
                { icon: "add-circle", label: "Deposit", route: "/trade" },
                { icon: "arrow-up-circle", label: "Withdraw", route: "/profile" },
                { icon: "swap-horizontal-outline", label: "Trade", route: "/trade" },
                { icon: "gift", label: "Rewards", route: "/rewards" },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  style={styles.quickAction}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(action.route as any);
                  }}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon as any} size={24} color={C.primary} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Rates</Text>
            <Pressable onPress={() => router.push("/trade")}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cryptoRow}>
            {cryptoAssets.map((asset, i) => (
              <CryptoTicker key={asset.id} asset={asset} index={i} />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Services</Text>
          </View>
          <View style={styles.servicesRow}>
            {[
              { icon: "card", label: "Gift Cards", color: "#F7931A", route: "/trade" },
              { icon: "call", label: "Airtime", color: "#00C853", route: "/bills" },
              { icon: "flash", label: "Electricity", color: "#627EEA", route: "/bills" },
              { icon: "people", label: "P2P", color: "#9945FF", route: "/trade" },
            ].map((svc) => (
              <Pressable
                key={svc.label}
                style={styles.serviceItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(svc.route as any);
                }}
              >
                <View style={[styles.serviceIcon, { backgroundColor: svc.color + "20" }]}>
                  <Ionicons name={svc.icon as any} size={22} color={svc.color} />
                </View>
                <Text style={styles.serviceLabel}>{svc.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Pressable onPress={() => router.push("/profile")}>
              <Text style={styles.seeAll}>View All</Text>
            </Pressable>
          </View>
          <View style={styles.txList}>
            {transactions.slice(0, 5).map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
            {transactions.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={40} color={C.textTertiary} />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 12 },
  greeting: { fontSize: 14, color: C.textSecondary, fontFamily: "DMSans_400Regular" },
  userName: { fontSize: 24, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.cardBg, alignItems: "center", justifyContent: "center" },
  walletCard: { borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletLabel: { fontSize: 14, color: C.textSecondary, fontFamily: "DMSans_400Regular" },
  walletBalance: { fontSize: 32, fontWeight: "800", color: C.text, marginTop: 8, fontFamily: "DMSans_700Bold" },
  walletTier: { marginTop: 8, marginBottom: 20 },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tierText: { fontSize: 11, fontWeight: "600", color: C.primary, fontFamily: "DMSans_600SemiBold" },
  quickActions: { flexDirection: "row", justifyContent: "space-between" },
  quickAction: { alignItems: "center", gap: 6 },
  quickActionIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.primaryMuted, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 11, color: C.textSecondary, fontFamily: "DMSans_400Regular" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  seeAll: { fontSize: 13, color: C.primary, fontFamily: "DMSans_600SemiBold" },
  cryptoRow: { gap: 12, paddingRight: 20, marginBottom: 24 },
  cryptoCard: { width: 140, backgroundColor: C.cardBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  cryptoIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cryptoSymbol: { fontSize: 13, fontWeight: "600", color: C.textSecondary, fontFamily: "DMSans_600SemiBold" },
  cryptoPrice: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 2, fontFamily: "DMSans_700Bold" },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 8 },
  changeText: { fontSize: 11, fontWeight: "600", fontFamily: "DMSans_600SemiBold" },
  servicesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  serviceItem: { alignItems: "center", gap: 8, flex: 1 },
  serviceIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  serviceLabel: { fontSize: 12, color: C.textSecondary, fontFamily: "DMSans_400Regular" },
  txList: { backgroundColor: C.cardBg, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  txItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "DMSans_600SemiBold" },
  txTime: { fontSize: 12, color: C.textTertiary, marginTop: 2, fontFamily: "DMSans_400Regular" },
  txAmount: { fontSize: 14, fontWeight: "700", fontFamily: "DMSans_700Bold" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: C.textTertiary, fontFamily: "DMSans_400Regular" },
});
