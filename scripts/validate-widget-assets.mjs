import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = join(PROJECT_ROOT, "public");
const SOURCE_CAT_DIRECTORY = join(PUBLIC_ROOT, "cats");
const WIDGET_ASSET_ROOT = join(PUBLIC_ROOT, "widget");
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const EXPECTED_DIMENSIONS = {
  cat: { width: 444, height: 444 },
  logo: { width: 224, height: 70 },
  bowl: { width: 84, height: 58 },
};

async function getPngFileNames(directory) {
  return (await readdir(directory))
    .filter((fileName) => fileName.endsWith(".png"))
    .sort();
}

async function validatePng(path, expectedDimensions) {
  const image = await readFile(path);

  if (
    image.length < 24 ||
    !image.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    throw new Error(`${path} is not a valid PNG file`);
  }

  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);

  if (
    width !== expectedDimensions.width ||
    height !== expectedDimensions.height
  ) {
    throw new Error(
      `${path} must be ${expectedDimensions.width}x${expectedDimensions.height}, received ${width}x${height}`,
    );
  }
}

async function validateWidgetAssets() {
  const sourceCats = await getPngFileNames(SOURCE_CAT_DIRECTORY);
  const widgetCatDirectory = join(WIDGET_ASSET_ROOT, "cats");
  const widgetCats = await getPngFileNames(widgetCatDirectory);

  if (sourceCats.join("\n") !== widgetCats.join("\n")) {
    const missingCats = sourceCats.filter(
      (fileName) => !widgetCats.includes(fileName),
    );
    const orphanedCats = widgetCats.filter(
      (fileName) => !sourceCats.includes(fileName),
    );

    throw new Error(
      [
        "Widget cat assets do not match source cat assets.",
        missingCats.length > 0
          ? `Missing: ${missingCats.join(", ")}`
          : null,
        orphanedCats.length > 0
          ? `Orphaned: ${orphanedCats.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  await Promise.all([
    ...widgetCats.map((fileName) =>
      validatePng(
        join(widgetCatDirectory, fileName),
        EXPECTED_DIMENSIONS.cat,
      ),
    ),
    validatePng(
      join(WIDGET_ASSET_ROOT, "brand", "logo.png"),
      EXPECTED_DIMENSIONS.logo,
    ),
    validatePng(
      join(WIDGET_ASSET_ROOT, "activity", "bowl_empty.png"),
      EXPECTED_DIMENSIONS.bowl,
    ),
    validatePng(
      join(WIDGET_ASSET_ROOT, "activity", "bowl_full.png"),
      EXPECTED_DIMENSIONS.bowl,
    ),
  ]);

  console.log(`Validated ${widgetCats.length + 3} widget assets.`);
}

validateWidgetAssets().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
