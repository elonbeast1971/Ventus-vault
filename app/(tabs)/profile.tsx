import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Share,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getUser, getTransactions, getBanks, type UserProfile, type Transaction, type BankAccount } from "@/lib/storage";

const C = Colors.dark;

function formatNaira(amount: number): string {
  const abs = Math.abs(amount);
  return (amount < 0 ? "-" : "") + "N" + abs.toLocaleString("en-NG");
}

const tierConfig = {
  basic: { label: "Basic Trader", color: "#627EEA", icon: "shield-outline" as const, next: "VIP Trader", progress: 0.35 },
  vip: { label: "VIP Trader", color: "#D4A843", icon: "shield-checkmark" as const, next: "Investor", progress: 0.65 },
  investor: { label: "Investor", color: "#00C853", icon: "diamond" as const, next: null, progress: 1 },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTop = Platform.OS === "web" ? 67 : 0;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);

  const loadData = useCallback(async () => {
    const [u, txns, bnks] = await Promise.all([getUser(), getTransactions(), getBanks()]);
    setUser(u);
    setTransactions(txns);
    setBanks(bnks);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join VentusVault and earn rewards! Use my referral code: ${user?.referralCode || "VENTUS-XXX"}\n\nTrade gift cards, crypto, and more with instant payouts!`,
      });
    } catch {}
  };

  const tier = tierConfig[user?.tier || "basic"];

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { borderColor: tier.color }]}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || "V"}</Text>
            </View>
            <Text style={styles.profileName}>{user?.name || "Trader"}</Text>
            <View style={[styles.tierPill, { backgroundColor: tier.color + "20" }]}>
              <Ionicons name={tier.icon} size={14} color={tier.color} />
              <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          {tier.next && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress to {tier.next}</Text>
                <Text style={styles.progressPercent}>{Math.round(tier.progress * 100)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${tier.progress * 100}%`, backgroundColor: tier.color }]} />
              </View>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(150)}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalTrades || 0}</Text>
              <Text style={styles.statLabel}>Trades</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statValue}>{user?.referralCount || 0}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNaira(user?.referralEarnings || 0)}</Text>
              <Text style={styles.statLabel}>Ref. Earned</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <LinearGradient
            colors={[C.primary + "20", C.primary + "08"]}
            style={styles.referralCard}
          >
            <View style={styles.referralTop}>
              <View>
                <Text style={styles.referralTitle}>Invite & Earn</Text>
                <Text style={styles.referralDesc}>
                  Share your code and earn {user?.tier === "investor" ? "8%" : user?.tier === "vip" ? "5%" : "2%"} on every trade
                </Text>
              </View>
              <Pressable style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color="#000" />
              </Pressable>
            </View>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your Referral Code</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert("Copied!", "Referral code copied to clipboard");
                }}
                style={styles.codeCopyRow}
              >
                <Text style={styles.codeText}>{user?.referralCode || "VENTUS-XXX"}</Text>
                <Ionicons name="copy-outline" size={18} color={C.primary} />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <Text style={styles.sectionTitle}>Saved Banks</Text>
          <View style={styles.bankList}>
            {banks.map((bank) => (
              <View key={bank.id} style={styles.bankItem}>
                <View style={styles.bankIcon}>
                  <Ionicons name="business" size={18} color={C.primary} />
                </View>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>{bank.bankName}</Text>
                  <Text style={styles.bankAcct}>{bank.accountNumber} - {bank.accountName}</Text>
                </View>
                {bank.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Transactions</Text>
            <Pressable onPress={() => setShowAllTx(!showAllTx)}>
              <Text style={styles.seeAll}>{showAllTx ? "Show Less" : "Show All"}</Text>
            </Pressable>
          </View>
          <View style={styles.txList}>
            {(showAllTx ? transactions : transactions.slice(0, 6)).map((tx) => {
              const isPositive = tx.amount > 0;
              const iconMap: Record<string, string> = {
                gift_card: "card", crypto_buy: "trending-up", crypto_sell: "trending-down",
                payout: "wallet", airtime: "call", bill: "receipt", reward: "star", referral: "people",
              };
              return (
                <View key={tx.id} style={styles.txItem}>
                  <View style={[styles.txIcon, { backgroundColor: (isPositive ? C.accentMuted : C.primaryMuted) }]}>
                    <Ionicons name={(iconMap[tx.type] || "ellipse") as any} size={16} color={isPositive ? C.accent : C.primary} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                    <Text style={styles.txTime}>
                      {new Date(tx.timestamp).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: isPositive ? C.accent : C.text }]}>
                    {isPositive ? "+" : ""}{formatNaira(tx.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(350)}>
          <View style={styles.menuList}>
            {[
              { icon: "person-outline", label: "Edit Profile", color: C.text },
              { icon: "lock-closed-outline", label: "Security", color: C.text },
              { icon: "help-circle-outline", label: "Support", color: C.text },
              { icon: "document-text-outline", label: "Terms & Privacy", color: C.text },
              { icon: "log-out-outline", label: "Sign Out", color: C.danger },
            ].map((item) => (
              <Pressable key={item.label} style={styles.menuItem} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
                <Text style={[styles.menuLabel, { color: item.color }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 20 },
  profileHeader: { alignItems: "center", paddingTop: 20, paddingBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.cardBg, alignItems: "center", justifyContent: "center", borderWidth: 3, marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "800", color: C.primary, fontFamily: "DMSans_700Bold" },
  profileName: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  tierPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginTop: 8 },
  tierLabel: { fontSize: 13, fontWeight: "600", fontFamily: "DMSans_600SemiBold" },
  progressSection: { backgroundColor: C.cardBg, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 13, color: C.textSecondary, fontFamily: "DMSans_400Regular" },
  progressPercent: { fontSize: 13, fontWeight: "700", color: C.primary, fontFamily: "DMSans_700Bold" },
  progressBar: { height: 6, backgroundColor: C.background, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  statsRow: { flexDirection: "row", backgroundColor: C.cardBg, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  statItem: { flex: 1, alignItems: "center" },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border },
  statValue: { fontSize: 18, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  statLabel: { fontSize: 12, color: C.textTertiary, marginTop: 4, fontFamily: "DMSans_400Regular" },
  referralCard: { borderRadius: 18, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: C.primary + "30" },
  referralTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  referralTitle: { fontSize: 18, fontWeight: "700", color: C.text, fontFamily: "DMSans_700Bold" },
  referralDesc: { fontSize: 13, color: C.textSecondary, marginTop: 4, maxWidth: 240, fontFamily: "DMSans_400Regular" },
  shareBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  codeBox: { backgroundColor: C.background, borderRadius: 14, padding: 16, marginTop: 16 },
  codeLabel: { fontSize: 12, color: C.textTertiary, fontFamily: "DMSans_400Regular" },
  codeCopyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  codeText: { fontSize: 20, fontWeight: "800", color: C.primary, letterSpacing: 1, fontFamily: "DMSans_700Bold" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 14, fontFamily: "DMSans_700Bold" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  seeAll: { fontSize: 13, color: C.primary, fontFamily: "DMSans_600SemiBold" },
  bankList: { backgroundColor: C.cardBg, borderRadius: 16, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: C.border },
  bankItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  bankIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryMuted, alignItems: "center", justifyContent: "center", marginRight: 12 },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "DMSans_600SemiBold" },
  bankAcct: { fontSize: 12, color: C.textTertiary, marginTop: 2, fontFamily: "DMSans_400Regular" },
  defaultBadge: { backgroundColor: C.accentMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  defaultText: { fontSize: 11, fontWeight: "600", color: C.accent, fontFamily: "DMSans_600SemiBold" },
  txList: { backgroundColor: C.cardBg, borderRadius: 16, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: C.border },
  txItem: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 10 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: "600", color: C.text, fontFamily: "DMSans_600SemiBold" },
  txTime: { fontSize: 11, color: C.textTertiary, marginTop: 2, fontFamily: "DMSans_400Regular" },
  txAmount: { fontSize: 13, fontWeight: "700", fontFamily: "DMSans_700Bold" },
  menuList: { backgroundColor: C.cardBg, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500", fontFamily: "DMSans_600SemiBold" },
});
