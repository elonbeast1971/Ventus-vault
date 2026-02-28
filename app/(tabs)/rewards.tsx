import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  FadeInDown,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rewardTypes } from "@/lib/crypto-data";
import { addReward, getRewards, updateUser, getUser, addTransaction, type RewardCard } from "@/lib/storage";
import * as Crypto from "expo-crypto";

const C = Colors.dark;
const { width } = Dimensions.get("window");

function GlassCard({ reward, index }: { reward: typeof rewardTypes[0]; index: number }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000 + index * 400, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.3, 0.5, 0.7, 1], [0.6, 0.9, 1, 0.9, 0.6]),
  }));

  return (
    <Animated.View style={shimmerStyle}>
      <LinearGradient
        colors={[reward.color + "30", reward.color + "10", reward.color + "20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glassCard}
      >
        <View style={styles.glassCardInner}>
          <View style={[styles.glassIconBg, { backgroundColor: reward.color + "25" }]}>
            <Ionicons
              name={
                reward.type === "cashback" ? "cash" :
                reward.type === "bonus" ? "star" :
                reward.type === "credit" ? "diamond" : "flash"
              }
              size={28}
              color={reward.color}
            />
          </View>
          <Text style={[styles.glassLabel, { color: reward.color }]}>{reward.label}</Text>
          <Text style={styles.glassType}>{reward.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.glassShine, { backgroundColor: reward.color + "08" }]} />
      </LinearGradient>
    </Animated.View>
  );
}

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const webTop = Platform.OS === "web" ? 67 : 0;
  const [spinning, setSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<typeof rewardTypes[0] | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<RewardCard[]>([]);
  const [spinsLeft, setSpinsLeft] = useState(3);

  const rotation = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    const rewards = await getRewards();
    setClaimedRewards(rewards);
  };

  const onSpinComplete = (reward: typeof rewardTypes[0]) => {
    setWonReward(reward);
    setSpinning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSpin = () => {
    if (spinning || spinsLeft <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setSpinning(true);
    setWonReward(null);
    setSpinsLeft(prev => prev - 1);

    const randomIndex = Math.floor(Math.random() * rewardTypes.length);
    const reward = rewardTypes[randomIndex];

    rotation.value = withSequence(
      withTiming(rotation.value + 1080 + randomIndex * 45, {
        duration: 3000,
        easing: Easing.out(Easing.cubic),
      })
    );

    cardScale.value = withSequence(
      withTiming(0.9, { duration: 200 }),
      withTiming(1.1, { duration: 1500 }),
      withSpring(1, { damping: 10 })
    );

    glowOpacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 2000 }),
      withTiming(0.6, { duration: 800 })
    );

    setTimeout(() => {
      runOnJS(onSpinComplete)(reward);
    }, 3000);
  };

  const claimReward = async () => {
    if (!wonReward) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const rewardCard: RewardCard = {
      id: Crypto.randomUUID(),
      type: wonReward.type,
      value: wonReward.value,
      label: wonReward.label,
      claimed: true,
      claimedAt: new Date().toISOString(),
    };

    await addReward(rewardCard);

    if (wonReward.type === "bonus" || wonReward.type === "credit") {
      const user = await getUser();
      await updateUser({ walletBalance: user.walletBalance + wonReward.value });
      await addTransaction({
        id: Crypto.randomUUID(),
        type: "reward",
        title: `Spin Reward: ${wonReward.label}`,
        amount: wonReward.value,
        status: "completed",
        timestamp: new Date().toISOString(),
        details: "Daily Spin Reward",
      });
    }

    Alert.alert("Reward Claimed!", `${wonReward.label} has been added to your account!`);
    setWonReward(null);
    loadRewards();
  };

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }, { scale: cardScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const currentDisplayReward = wonReward || rewardTypes[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Rewards</Text>
        <View style={styles.spinsCounter}>
          <Ionicons name="refresh" size={14} color={C.primary} />
          <Text style={styles.spinsText}>{spinsLeft} spins left</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.spinSection}>
            <Animated.View style={glowStyle}>
              <View style={styles.glowRing} />
            </Animated.View>

            <Animated.View style={[styles.spinCardContainer, spinStyle]}>
              <GlassCard reward={currentDisplayReward} index={0} />
            </Animated.View>

            {wonReward && !spinning && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.wonBanner}>
                <Text style={styles.wonText}>You won {wonReward.label}!</Text>
                <Pressable style={styles.claimBtn} onPress={claimReward}>
                  <Ionicons name="checkmark-circle" size={18} color="#000" />
                  <Text style={styles.claimBtnText}>Claim Reward</Text>
                </Pressable>
              </Animated.View>
            )}

            <Pressable
              style={[styles.spinBtn, (spinning || spinsLeft <= 0) && styles.spinBtnDisabled]}
              onPress={handleSpin}
              disabled={spinning || spinsLeft <= 0}
            >
              <Ionicons name="refresh" size={22} color={spinning || spinsLeft <= 0 ? C.textTertiary : "#000"} />
              <Text style={[styles.spinBtnText, (spinning || spinsLeft <= 0) && styles.spinBtnTextDisabled]}>
                {spinning ? "Spinning..." : spinsLeft <= 0 ? "No Spins Left" : "Spin Now"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardRow}>
            {rewardTypes.map((reward, i) => (
              <GlassCard key={i} reward={reward} index={i} />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={styles.sectionTitle}>Claimed Rewards</Text>
          {claimedRewards.length > 0 ? (
            <View style={styles.claimedList}>
              {claimedRewards.slice(0, 10).map((r) => (
                <View key={r.id} style={styles.claimedItem}>
                  <View style={[styles.claimedIcon, { backgroundColor: C.primaryMuted }]}>
                    <Ionicons name="trophy" size={16} color={C.primary} />
                  </View>
                  <View style={styles.claimedInfo}>
                    <Text style={styles.claimedLabel}>{r.label}</Text>
                    <Text style={styles.claimedDate}>
                      {r.claimedAt ? new Date(r.claimedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : ""}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={C.accent} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={40} color={C.textTertiary} />
              <Text style={styles.emptyText}>Spin to earn rewards</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 20 },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 8, marginTop: 12 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: C.text, fontFamily: "DMSans_700Bold" },
  spinsCounter: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.primaryMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  spinsText: { fontSize: 13, fontWeight: "600", color: C.primary, fontFamily: "DMSans_600SemiBold" },
  spinSection: { alignItems: "center", paddingVertical: 30 },
  glowRing: { position: "absolute", width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: C.primary + "40", top: -10, left: -10 },
  spinCardContainer: { marginBottom: 24 },
  glassCard: { width: 200, height: 260, borderRadius: 20, padding: 3, overflow: "hidden" },
  glassCardInner: { flex: 1, backgroundColor: C.cardBg + "DD", borderRadius: 18, padding: 20, alignItems: "center", justifyContent: "center", gap: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  glassIconBg: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  glassLabel: { fontSize: 18, fontWeight: "700", textAlign: "center", fontFamily: "DMSans_700Bold" },
  glassType: { fontSize: 11, color: C.textTertiary, letterSpacing: 2, fontFamily: "DMSans_600SemiBold" },
  glassShine: { position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: 60, transform: [{ rotate: "45deg" }] },
  wonBanner: { alignItems: "center", gap: 12, marginBottom: 16 },
  wonText: { fontSize: 20, fontWeight: "700", color: C.accent, fontFamily: "DMSans_700Bold" },
  claimBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  claimBtnText: { fontSize: 15, fontWeight: "700", color: "#000", fontFamily: "DMSans_700Bold" },
  spinBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  spinBtnDisabled: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border },
  spinBtnText: { fontSize: 18, fontWeight: "700", color: "#000", fontFamily: "DMSans_700Bold" },
  spinBtnTextDisabled: { color: C.textTertiary },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 14, marginTop: 8, fontFamily: "DMSans_700Bold" },
  rewardRow: { gap: 14, paddingRight: 20, marginBottom: 24 },
  claimedList: { backgroundColor: C.cardBg, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  claimedItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  claimedIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  claimedInfo: { flex: 1 },
  claimedLabel: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "DMSans_600SemiBold" },
  claimedDate: { fontSize: 12, color: C.textTertiary, marginTop: 2, fontFamily: "DMSans_400Regular" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 8, backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 14, color: C.textTertiary, fontFamily: "DMSans_400Regular" },
});
