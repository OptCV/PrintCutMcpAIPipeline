import { basename } from "node:path";

export type ParsedDimensions = {
  widthIn: number;
  heightIn: number;
  matched: string;
};

const DIMENSION_PATTERN =
  /(?:^|[^0-9.])(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)(?:\s*(?:in|inch|inches|"))?(?=$|[^0-9.])/;

export function parseDimensionsFromFilename(filePath: string): ParsedDimensions | null {
  const match = basename(filePath).match(DIMENSION_PATTERN);
  if (!match) return null;

  const widthIn = Number(match[1]);
  const heightIn = Number(match[2]);

  if (!Number.isFinite(widthIn) || !Number.isFinite(heightIn) || widthIn <= 0 || heightIn <= 0) {
    return null;
  }

  return { widthIn, heightIn, matched: match[0].trim() };
}
