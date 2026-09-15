import type { CatState } from "./cat-state";

export type WidgetCatState = Exclude<
  CatState,
  "coffee" | "idea" | "surprised"
>;

export const CAT_STATE_MESSAGES = {
  normal: "흠, 나쁘지 않은 시작이야.",
  coding: "오, 흐름이 끊기지 않네.",
  happy: "요즘 제법 기분 좋아.",
  cheering: "좋아, 이대로 계속 가보자.",
  excited: "내일도 기대해도 되는 거지?",
  proud: "여기까지 꾸준히 온 거, 꽤 멋진데.",
  love: "역시 내 집사야. ♡",
  waiting: "오늘은 조금 조용하네.",
  nervous: "...조금 늦는 것 같은데.",
  crying: "나 계속 기다리고 있는데...",
  angry: "집사. 언제까지 기다리게 할 거야?",
  tired: "이제 기다리는 것도 지쳤어.",
  burned_out: "...기다릴 힘도 안 남았어.",
  sleeping: "...올 때까지 자고 있을게.",
  peeking: "...진짜 돌아온 거야?",
  celebrating: "이건 좀 자랑해도 되겠다.",
  confused: "잠깐, 뭔가 이상한데.",
} as const satisfies Record<WidgetCatState, string>;

export function getCatStateMessage(state: WidgetCatState) {
  return CAT_STATE_MESSAGES[state];
}
