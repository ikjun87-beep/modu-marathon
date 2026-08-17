/**
 * 크루 역할 (push 페이지, PHASE 2-C) — 크루장 표시 + 관리자 승격·강등.
 * 크루장 판정은 crews/{id}.ownerUid 하나뿐이다(멤버 role엔 'owner'를 절대 안 씀 — firestore.rules 참고).
 */
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, FONT, Weight, Radius, Shadow, leading } from "@/lib/brand";
import { isCrewOwner, subscribeCrew, type CrewDoc } from "@/lib/crew-notice";
import {
  demoteToMember,
  promoteToAdmin,
  resolveMissingNames,
  subscribeMembers,
  type Member,
} from "@/lib/crew-roster";

export default function CrewRolesScreen() {
  const [crew, setCrew] = useState<CrewDoc | null | undefined>(undefined);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => subscribeCrew(setCrew), []);
  useEffect(
    () =>
      subscribeMembers((raw) => {
        void resolveMissingNames(raw).then(setMembers);
      }),
    []
  );

  const iAmOwner = isCrewOwner(crew ?? null);
  const loading = crew === undefined || members === null;

  const owner = useMemo(() => members?.find((m) => m.uid === crew?.ownerUid) ?? null, [members, crew]);
  const others = useMemo(
    () =>
      (members ?? [])
        .filter((m) => m.uid !== crew?.ownerUid)
        .sort((a, b) => (a.role === b.role ? 0 : a.role === "admin" ? -1 : 1)),
    [members, crew]
  );

  async function promote(m: Member) {
    setBusyUid(m.uid);
    try {
      await promoteToAdmin(m.uid);
    } catch (e: any) {
      Alert.alert("승격하지 못했어요", String(e?.message ?? e));
    } finally {
      setBusyUid(null);
    }
  }
  async function demote(m: Member) {
    setBusyUid(m.uid);
    try {
      await demoteToMember(m.uid);
    } catch (e: any) {
      Alert.alert("변경하지 못했어요", String(e?.message ?? e));
    } finally {
      setBusyUid(null);
    }
  }

  const back = (
    <PressableScale style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
      <Icon name="chevron-left" size={24} color={Brand.ink} />
    </PressableScale>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        {back}
        <Text style={styles.topTitle}>크루 역할</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <>
            <Skeleton height={70} radius={16} />
            <Skeleton height={200} radius={16} />
          </>
        ) : (
          <>
            {owner && (
              <View style={styles.ownerCard}>
                <Avatar name={owner.name ?? "?"} size={40} ring={false} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {owner.name ?? "이름 미확인"}
                  </Text>
                  <Text style={styles.rowSub}>이 크루를 만든 사람</Text>
                </View>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>크루장</Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionH}>크루원 {others.length}명</Text>
            <View style={styles.card}>
              {others.length ? (
                others.map((m, i) => (
                  <View key={m.uid} style={[styles.memberRow, i > 0 && styles.memberRowLine]}>
                    <Avatar name={m.name ?? "?"} size={32} ring={false} />
                    <Text style={styles.rowName} numberOfLines={1}>
                      {m.name ?? "이름 미확인"}
                    </Text>
                    {m.role === "admin" && (
                      <View style={styles.roleTagSoft}>
                        <Text style={styles.roleTagSoftText}>관리자</Text>
                      </View>
                    )}
                    {iAmOwner && (
                      <PressableScale
                        style={styles.actionBtn}
                        onPress={() => void (m.role === "admin" ? demote(m) : promote(m))}
                        disabled={busyUid === m.uid}
                        dim={false}>
                        <Text style={styles.actionBtnText}>
                          {busyUid === m.uid ? "처리 중…" : m.role === "admin" ? "해제" : "관리자로"}
                        </Text>
                      </PressableScale>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.empty}>아직 다른 크루원이 없어요.</Text>
              )}
            </View>

            {!iAmOwner && <Text style={styles.hint}>역할 변경은 크루장만 할 수 있어요.</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: Radius.input },
  topTitle: { fontFamily: FONT, fontSize: 16, lineHeight: leading(16), fontWeight: Weight.bold, color: Brand.ink },
  body: { padding: 18, gap: 12, paddingBottom: 48 },
  sectionH: { fontFamily: FONT, fontSize: 15, lineHeight: leading(15), fontWeight: Weight.bold, color: Brand.ink, marginTop: 6 },
  card: { backgroundColor: Brand.card, borderRadius: Radius.card, padding: 6, ...Shadow.soft },
  empty: { fontFamily: FONT, fontSize: 13.5, lineHeight: leading(13.5), color: Brand.soft, textAlign: "center", paddingVertical: 14 },

  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 14,
    ...Shadow.soft,
  },
  rowName: { flex: 1, fontFamily: FONT, fontSize: 14.5, lineHeight: leading(14.5), fontWeight: Weight.bold, color: Brand.ink },
  rowSub: { fontFamily: FONT, fontSize: 12, lineHeight: leading(12), color: Brand.soft, marginTop: 2 },
  // 정보 블록(누가 크루장인지)은 액션이 아니라 정보다 — 전역 규칙대로 다크 네이비로 둔다.
  roleTag: { backgroundColor: Brand.dark, borderRadius: Radius.chip, paddingHorizontal: 10, paddingVertical: 5 },
  roleTagText: { color: "#fff", fontFamily: FONT, fontSize: 12, fontWeight: Weight.bold },
  roleTagSoft: { backgroundColor: Brand.brandSoft, borderRadius: Radius.chip, paddingHorizontal: 9, paddingVertical: 4 },
  roleTagSoftText: { color: Brand.brandDeep, fontFamily: FONT, fontSize: 11.5, fontWeight: Weight.bold },

  memberRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 8 },
  memberRowLine: { borderTopWidth: 1, borderTopColor: Brand.line },
  actionBtn: { backgroundColor: Brand.warm, borderRadius: Radius.chip, paddingHorizontal: 12, paddingVertical: 7 },
  actionBtnText: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.soft },
  hint: { fontFamily: FONT, fontSize: 12.5, lineHeight: leading(12.5), color: Brand.faint, textAlign: "center" },
});
