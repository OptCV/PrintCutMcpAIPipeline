export type SourceAsset = {
  id: string;
  fileName: string;
  sourcePath: string;
  finishedWidthIn: number;
  finishedHeightIn: number;
  bleedIn: number;
};

export type PackRect = {
  itemId: string;
  width: number;
  height: number;
};

export type PackedRect = PackRect & {
  x: number;
  y: number;
  rotated: boolean;
};

export type RegMark = {
  x: number;
  y: number;
  diameterIn: number;
};

export type LayoutItem = {
  id: string;
  fileName: string;
  sourcePath: string;
  rotated: boolean;
  finishedSizeIn: { width: number; height: number };
  artworkBoundsIn: { x: number; y: number; width: number; height: number };
  cutBoundsIn: { x: number; y: number; width: number; height: number };
};

export type LayoutPage = {
  page: number;
  documentWidthIn: number;
  documentHeightIn: number;
  artworkAreaBoundsIn: { left: number; top: number; right: number; bottom: number };
  items: LayoutItem[];
  registrationMarks: RegMark[];
  printPdf: string;
  cutPdf: string;
};

export type JobManifest = {
  version: 1;
  batchId: string;
  createdAt: string;
  input: {
    maxPdfWidthIn: number;
    maxPdfLengthIn: number;
    bleedIn: number;
    itemGapIn: number;
    allowRotation: boolean;
  };
  registration: {
    diameterIn: number;
    offsetFromArtworkIn: number;
    extraMarksAfterIn: number;
    extraMarkSpacingIn: number;
    color: "100K";
  };
  rules: {
    filenameDimensionsAreFinishedSize: true;
    cutPathIsFinishedSize: true;
    artworkExtendsByBleed: true;
    printCutUseIdenticalGeometry: true;
    printCutLinesHidden: true;
    cutArtworkHidden: true;
  };
  pages: LayoutPage[];
};
