import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getCatStateImagePath } from "./cat-state";
import {
  getCatStateMessage,
  type WidgetCatState,
} from "./cat-message";

const WIDGET_WIDTH = 400;
const WIDGET_HEIGHT = 440;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function renderWidget(state: WidgetCatState) {
  const imagePath = join(
    process.cwd(),
    "public",
    getCatStateImagePath(state),
  );
  const image = await readFile(imagePath);
  const message = getCatStateMessage(state);
  const escapedMessage = escapeXml(message);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDGET_WIDTH}" height="${WIDGET_HEIGHT}" viewBox="0 0 ${WIDGET_WIDTH} ${WIDGET_HEIGHT}" role="img" aria-label="${escapedMessage}">
  <title>${escapedMessage}</title>
  <image href="data:image/png;base64,${image.toString("base64")}" x="20" y="0" width="360" height="360" />
  <rect x="12" y="370" width="376" height="58" rx="18" fill="#f6f8fa" stroke="#d0d7de" />
  <text x="200" y="399" text-anchor="middle" dominant-baseline="middle" fill="#24292f" font-family="Arial, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif" font-size="17" font-weight="600">${escapedMessage}</text>
</svg>`;
}
