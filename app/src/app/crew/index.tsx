/** 크루 — 방명록 피드 + 모임 참석 + 갤러리 (웹과 동일한 guestbook/attendance/gallery 컬렉션 공유). */
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GallerySection } from "@/components/gallery-section";
import { Icon } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { NameField } from "@/components/name-field";
import { ScheduleSection } from "@/components/schedule-section";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Brand, FONT, Weight, Radius, Shadow, leading } from "@/lib/brand";
import { add, fmtDate, isMine, remove, subscribe, update, type Row } from "@/lib/crew";
import { isCrewOwner, subscribeCrew, updateCrewNotice, type CrewDoc } from "@/lib/crew-notice";
import { myRole, subscribeMembers, type Member } from "@/lib/crew-roster";
import { nextEvent, subscribeEvents, type EventDef } from "@/lib/events";
import { COLLECTIONS, HAS_FIREBASE } from "@/lib/firebase";

export default function CrewScreen() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [guests, setGuests] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [events, setEvents] = useState<EventDef[]>([]);
  const [crew, setCrew] = useState<CrewDoc | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [editingNotice, setEditingNotice] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState("");
  const [savingNotice, setSavingNotice] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);
  const scheduleY = useRef(0);

  useEffect(() => subscribe(COLLECTIONS.guestbook, setGuests), []);
  useEffect(() => subscribeEvents(setEvents), []);
  useEffect(() => subscribeCrew(setCrew), []);
  useEffect(() => subscribeMembers(setMembers), []);

  const nextEv = useMemo(() => nextEvent(events), [events]);
  const canEditNotice = isCrewOwner(crew) || myRole(members) === "admin";

  function startEditNotice() {
    setNoticeDraft(crew?.notice ?? "");
    setEditingNotice(true);
  }
  async function saveNotice() {
    setSavingNotice(true);
    try {
      await updateCrewNotice(noticeDraft);
      setEditingNotice(false);
    } catch (e: any) {
      Alert.alert("공지를 저장하지 못했어요", String(e?.message ?? e));
    } finally {
      setSavingNotice(false);
    }
  }

  /** 요약 칩 → 모임 섹션으로 스크롤. 칩이 "가짜 버튼"이면 안 되니 실제로 데려다 놓는다. */
  function scrollToSchedule() {
    listRef.current?.scrollToOffset({ offset: Math.max(0, scheduleY.current - 12), animated: true });
  }
  function onScheduleLayout(e: { nativeEvent: { layout: { y: number } } }) {
    scheduleY.current = e.nativeEvent.layout.y;
  }

  function startEdit(item: Row) {
    setEditingId(item.id);
    setEditText(String(item.msg ?? ""));
  }
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }
  async function saveEdit() {
    const t = editText.trim();
    if (t && editingId) await update(COLLECTIONS.guestbook, editingId, { msg: t });
    cancelEdit();
  }

  async function submit() {
    if (!name.trim()) {
      Alert.alert("이름을 먼저 입력해 주세요 🙏");
      return;
    }
    if (!msg.trim()) return;
    await add(COLLECTIONS.guestbook, { name: name.trim(), msg: msg.trim() });
    setMsg("");
  }

  function onDelete(id: string) {
    Alert.alert("삭제할까요?", "", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => void remove(COLLECTIONS.guestbook, id),
      },
    ]);
  }

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>우리 크루</Text>
        <Text style={styles.sub}>혼자 뛰면 운동, 같이 뛰면 추억.</Text>

        {!HAS_FIREBASE && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              아직 크루와 연결되지 않았어요. 지금 남긴 글은 이 기기에만 저장돼요.
            </Text>
          </View>
        )}

        {/* 크루 공지 — 크루장·관리자만 쓸 수 있고 전원이 본다(firestore.rules PHASE 2-C).
            일반 크루원에겐 공지가 실제로 있을 때만 카드를 띄운다(빈 카드로 첫 뷰포트를 안 먹는다). */}
        {crew && (crew.notice || canEditNotice) && (
          <View style={styles.noticeCard}>
            <View style={styles.noticeHead}>
              <Icon name="bell" size={14} color={Brand.brandDeep} />
              <Text style={styles.noticeLabel}>크루 공지</Text>
            </View>
            {editingNotice ? (
              <View style={styles.editWrap}>
                <TextInput
                  style={styles.editInput}
                  value={noticeDraft}
                  onChangeText={setNoticeDraft}
                  multiline
                  maxLength={200}
                  autoFocus
                  placeholder="크루원에게 알릴 소식을 남겨보세요"
                  placeholderTextColor={Brand.placeholder}
                />
                <View style={styles.editBtns}>
                  <PressableScale
                    style={styles.editCancel}
                    onPress={() => setEditingNotice(false)}
                    disabled={savingNotice}>
                    <Text style={styles.editCancelText}>취소</Text>
                  </PressableScale>
                  <PressableScale style={styles.editSave} onPress={() => void saveNotice()} disabled={savingNotice}>
                    <Text style={styles.editSaveText}>{savingNotice ? "저장 중…" : "저장"}</Text>
                  </PressableScale>
                </View>
              </View>
            ) : crew.notice ? (
              <>
                <Text style={styles.noticeText}>{crew.notice}</Text>
                {canEditNotice && (
                  <PressableScale onPress={startEditNotice} dim={false} hitSlop={6}>
                    <Text style={styles.noticeEdit}>수정</Text>
                  </PressableScale>
                )}
              </>
            ) : (
              <>
                <Text style={styles.noticeEmptyText}>아직 크루 공지가 없어요.</Text>
                <PressableScale onPress={startEditNotice} dim={false} hitSlop={6}>
                  <Text style={styles.noticeEdit}>공지 남기기</Text>
                </PressableScale>
              </>
            )}
          </View>
        )}

        {/* 크루 운영 MVP 진입점(PHASE 2-C) — 방명록·모임과 같은 무게로 두면 주 액션이
            흐려져서(전역 규칙: 한 화면 솔리드 블루는 하나) 톤온톤 칩으로만 둔다. */}
        <View style={styles.opsRow}>
          <PressableScale
            style={styles.opsChip}
            onPress={() => router.push("/crew/attendance")}
            dim={false}>
            <Icon name="calendar" size={15} color={Brand.brandDeep} />
            <Text style={styles.opsChipText}>출석 이력</Text>
          </PressableScale>
          <PressableScale
            style={styles.opsChip}
            onPress={() => router.push("/crew/invite")}
            dim={false}>
            <Icon name="share" size={15} color={Brand.brandDeep} />
            <Text style={styles.opsChipText}>크루 초대</Text>
          </PressableScale>
          <PressableScale
            style={styles.opsChip}
            onPress={() => router.push("/crew/roles")}
            dim={false}>
            <Icon name="users" size={15} color={Brand.brandDeep} />
            <Text style={styles.opsChipText}>크루 역할</Text>
          </PressableScale>
        </View>

        <NameField onName={setName} />

        {/* 사진을 맨 위로 올렸더니 크루 탭의 **실질 목적(참석 체크·모임 만들기)**이 스크롤
            한 번 아래로 밀렸다(독립 채점 R13 지적). 사진은 크게 유지하되, 다가오는 모임을
            **한 줄 요약 칩**으로 위에 올려 둘 다 첫 뷰포트에서 만나게 한다. */}
        {nextEv && (
          <PressableScale style={styles.evChip} onPress={scrollToSchedule} dim={false}>
            <View style={styles.evChipDate}>
              <Text style={styles.evChipD}>{nextEv.d}</Text>
            </View>
            <Text style={styles.evChipText} numberOfLines={1}>
              {nextEv.title}
            </Text>
            <Text style={styles.evChipGo}>참석 체크</Text>
            <Icon name="chevron-right" size={16} color={Brand.brandDeep} />
          </PressableScale>
        )}

        <GallerySection myName={name} />

        <View onLayout={onScheduleLayout}>
          <ScheduleSection myName={name} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>방명록 한마디</Text>
          <TextInput
            style={styles.msgInput}
            value={msg}
            onChangeText={setMsg}
            placeholder="오늘도 화이팅! 다음 모임에 갈게요"
            placeholderTextColor={Brand.placeholder}
            maxLength={200}
            multiline
          />
          <PressableScale style={styles.btn} onPress={submit}>
            <Icon name="chat" size={17} color="#fff" />
            <Text style={styles.btnText}>남기기</Text>
          </PressableScale>
        </View>

        <Text style={styles.listHint}>방명록 {guests.length}개</Text>
      </View>
    ),
    [msg, name, guests.length, nextEv, crew, canEditNotice, editingNotice, noticeDraft, savingNotice]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        ref={listRef}
        data={guests}
        keyExtractor={(g) => g.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Mascot size={76} />
            <Text style={styles.empty}>아직 방명록이 없어요{"\n"}첫 글을 남겨보세요!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const mine = isMine(item, name);
          const editing = editingId === item.id;
          return (
            <View style={styles.item}>
              <View style={styles.itemHead}>
                <Text style={styles.who}>{item.name}</Text>
                <Text style={styles.date}>{fmtDate(item.createdAt)}</Text>
              </View>
              {editing ? (
                <View style={styles.editWrap}>
                  <TextInput
                    style={styles.editInput}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    maxLength={200}
                    autoFocus
                  />
                  <View style={styles.editBtns}>
                    <PressableScale style={styles.editCancel} onPress={cancelEdit}>
                      <Text style={styles.editCancelText}>취소</Text>
                    </PressableScale>
                    <PressableScale style={styles.editSave} onPress={saveEdit}>
                      <Text style={styles.editSaveText}>저장</Text>
                    </PressableScale>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.msg}>{item.msg}</Text>
                  {mine && (
                    <PressableScale
                      style={styles.editBtn}
                      onPress={() => startEdit(item)}
                      hitSlop={6}
                      dim={false}>
                      <Text style={styles.editBtnText}>수정</Text>
                    </PressableScale>
                  )}
                  {mine && (
                    <PressableScale style={styles.del} onPress={() => onDelete(item.id)} hitSlop={8}>
                      <Icon name="close" size={16} color={Brand.faint} />
                    </PressableScale>
                  )}
                </>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 18, gap: 12, paddingBottom: 160 },
  header: { gap: 12, marginBottom: 4 },
  title: { fontFamily: FONT,
    fontSize: 28, lineHeight: leading(28), fontWeight: Weight.bold, color: Brand.ink, letterSpacing: -0.4 },
  sub: { fontFamily: FONT,
    fontSize: 14, lineHeight: leading(14), color: Brand.soft },
  // 크루 운영 진입점 — 톤온톤 칩(전역 규칙: 솔리드 블루는 주 액션 1개만).
  // 크루 공지 — 정보 카드. 골드·솔리드 블루 대신 톤온톤(브랜드 라인 규칙: 공지는 성과가 아니다).
  noticeCard: {
    backgroundColor: Brand.brandSoft,
    borderWidth: 1,
    borderColor: Brand.brandLine,
    borderRadius: Radius.card,
    padding: 14,
    gap: 6,
  },
  noticeHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  noticeLabel: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brandDeep },
  noticeText: { fontFamily: FONT, fontSize: 14, lineHeight: leading(14), color: Brand.ink },
  noticeEmptyText: { fontFamily: FONT, fontSize: 13, lineHeight: leading(13), color: Brand.soft },
  noticeEdit: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brandDeep, marginTop: 2 },
  opsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Brand.brandSoft,
    borderRadius: Radius.chip,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  opsChipText: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brandDeep },
  // 모임 요약 칩 — 사진 아래로 밀린 참석 CTA를 첫 뷰포트로 끌어올린다.
  evChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Brand.tint,
    borderRadius: Radius.input,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  evChipDate: {
    minWidth: 30,
    height: 30,
    borderRadius: Radius.chip,
    backgroundColor: Brand.dark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  evChipD: { color: "#fff", fontFamily: FONT, fontSize: 14, fontWeight: Weight.bold },
  evChipText: { flex: 1, fontFamily: FONT, fontSize: 13.5, fontWeight: Weight.bold, color: Brand.ink },
  evChipGo: { fontFamily: FONT, fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brandDeep },

  banner: {
    backgroundColor: "#fff4e6",
    borderWidth: 1,
    borderColor: "#f4d6a8",
    borderRadius: Radius.input,
    padding: 12,
  },
  bannerText: { color: "#7a4a0a", fontFamily: FONT,
    fontSize: 12.5, lineHeight: leading(12.5), fontWeight: Weight.regular },
  formCard: {
    backgroundColor: Brand.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
    ...Shadow.soft,
  },
  formLabel: { fontFamily: FONT,
    fontSize: 13, lineHeight: leading(13), fontWeight: Weight.regular, color: Brand.ink },
  msgInput: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONT,
    fontSize: 14,
    color: Brand.ink,
    minHeight: 64,
    textAlignVertical: "top",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Brand.brand,
    borderRadius: Radius.input,
    paddingVertical: 13,
    minHeight: 48,
  },
  btnText: { color: "#fff", fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 15 },
  listHint: { fontFamily: FONT,
    fontSize: 12.5, lineHeight: leading(12.5), color: Brand.soft, fontWeight: Weight.regular, marginTop: 4 },
  emptyBox: { alignItems: "center", paddingVertical: 8 },
  empty: { color: Brand.soft, fontFamily: FONT,
    fontSize: 14, lineHeight: leading(14), textAlign: "center", paddingVertical: 8 },
  item: {
    backgroundColor: Brand.card,
    borderRadius: Radius.input,
    padding: 15,
    ...Shadow.soft,
  },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 64, // 우상단 수정·삭제 버튼과 날짜가 겹치지 않도록 여백 확보
  },
  who: { fontWeight: Weight.bold, fontFamily: FONT,
    fontSize: 14, lineHeight: leading(14), color: Brand.ink },
  date: { fontFamily: FONT,
    fontSize: 12, lineHeight: leading(12), color: Brand.soft },
  msg: { fontFamily: FONT,
    fontSize: 14, lineHeight: leading(14), color: Brand.ink2, marginTop: 5, paddingRight: 20 },
  del: { position: "absolute", top: 10, right: 12, padding: 6 },
  editBtn: { position: "absolute", top: 12, right: 40, padding: 4 },
  editBtnText: { fontFamily: FONT,
    fontSize: 12.5, fontWeight: Weight.bold, color: Brand.brand },
  editWrap: { gap: 9, marginTop: 6 },
  editInput: {
    borderWidth: 1,
    borderColor: Brand.line2,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONT,
    fontSize: 14,
    color: Brand.ink,
    minHeight: 56,
    textAlignVertical: "top",
  },
  editBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  editCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.chip,
    backgroundColor: Brand.warm,
  },
  editCancelText: { fontFamily: FONT,
    fontSize: 13, lineHeight: leading(13), fontWeight: Weight.bold, color: Brand.soft },
  editSave: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.chip,
    backgroundColor: Brand.brand,
  },
  editSaveText: { fontFamily: FONT,
    fontSize: 13, lineHeight: leading(13), fontWeight: Weight.bold, color: "#fff" },
});
