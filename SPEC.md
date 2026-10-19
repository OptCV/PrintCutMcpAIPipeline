# MVP Specification

This file is the authoritative production contract for Phase 1.

1. Accept artwork files supported by the workflow, including PDF, PNG, JPG and JPEG.
2. Detect final dimensions from filenames such as `12x18`.
3. Allow manually supplied dimensions when filename dimensions are absent or overridden.
4. Respect the requested final size. Add bleed outside that final size when requested.
5. Use rectangular cut paths for Phase 1.
6. Registration marks are solid black circles, exactly 0.25 inches in diameter.
7. Default maximum final PDF width is 48 inches, but ask the operator for the batch value.
8. Use improved MaxRects nesting derived from the prior Illustrator JSX.
9. Allow 90-degree rotation during nesting.
10. Produce one PRINT PDF when the layout fits within the operator's maximum length; otherwise produce multiple PRINT PDFs.
11. Produce one matching CUT PDF when the layout fits within the operator's maximum length; otherwise produce multiple CUT PDFs.
12. Registration marks must be geometrically identical between every matching PRINT/CUT pair.

## Clarified geometry rules

- Filename/manual dimensions mean FINISHED CUT size.
- Bleed expands artwork outside the finished cut rectangle.
- Bleed never changes the cut rectangle dimensions.
- Maximum width and maximum length apply to the entire exported PDF including registration marks.
- PRINT and CUT are exported from the same master document geometry.
- PRINT: artwork + registration marks; cut lines hidden.
- CUT: cut lines + registration marks; artwork hidden.
- Each split panel always produces a synchronized PRINT/CUT pair.
- A single item is never tiled across multiple panels in Phase 1.
