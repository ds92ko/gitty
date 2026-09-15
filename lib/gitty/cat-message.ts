import type { CatState } from "./cat-state";

export type WidgetCatState = Exclude<
  CatState,
  "coffee" | "idea" | "surprised"
>;

export const CAT_STATE_MESSAGES = {
  normal: "뭐... 나쁘진 않다냥",
  coding: "오? 기대 이상이구냥",
  happy: "아주 마음에 든다냥!",
  cheering: "집사, 제법이구냥!",
  excited: "이 맛에 집사 키운다냥! ✨",
  proud: "엣헴! 훌륭하구냥, 칭찬해 주겠다냥!",
  love: "역시 내 집사다냥 ♡",
  waiting: "집사 언제 오냥...?",
  nervous: "집사... 좀 늦는 거 아니냥?",
  crying: "집사... 나 안 보고 싶냥...? 🥺",
  angry: "집사! 냥냥펀치 맞고 싶냥? 💢",
  tired: "치... 단단히 삐졌다냥",
  burned_out: "...이젠 기다릴 힘도 없다냥",
  sleeping: "냐앙... 쿨쿨... 💤",
  peeking: "그동안 나 보고 싶었냥? 👀",
  celebrating: "이건 자랑해도 되겠다냥! 🎉",
  confused: "잠깐... 뭔가 이상하다냥? 🌀",
} as const satisfies Record<WidgetCatState, string>;

export function getCatStateMessage(state: WidgetCatState) {
  return CAT_STATE_MESSAGES[state];
}
