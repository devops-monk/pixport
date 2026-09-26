# Pixport: plan for a passport photo studio and editor

> **Status (2026-09-26): implemented.** Both flows are built, 16 unit tests pass, and the production build was verified end to end in Chrome under the `/pixport/` base path. The notes below describe how the build differs from the original plan.
> - Vite 8 and vitest 5 were used (current releases). TypeScript strict is the only lint gate; ESLint/Prettier were not added.
> - A 4×6 in sheet fits 8 photos at 35×45 mm by turning them sideways; the layout picks whichever orientation fits more.
> - The background model is `isnet_fp16` on WebGPU and `isnet_quint8` (44 MB) on CPU.
> - The expression check uses MediaPipe smile and jaw blendshapes.

## Context
The goal is a polished web app, styled like an Apple app, that can:
- edit photos: remove or replace the background, adjust, crop and more;
- make compliant passport, visa and ID photos for many countries;
- deploy to **GitHub Pages**.

The repo holds three reference projects:
- **photogen**: Next.js + FastAPI.
  - Has the best crop math: eye line and head ratio from `backend/app/core/cropping.py`.
  - Has a client-side print sheet in `frontend/src/lib/printSheet.ts`.
  - Its specs live in `shared/photo_requirements.json` (9 entries).
- **idify**: Vite + React.
  - Removes backgrounds in the browser (`@zhbhun/background-removal`, an imgly fork, in `common/src/stores/SegmentStore.ts`).
  - Has background and gradient drawing in `common/src/uitls/canvas.ts`.
  - Has a large spec dataset of 544 entries in `common/src/config/spec.json`. It is GPL, so we use it only as a reference and do not copy it.
- **rubypassport**: Vite + React 19 + zustand + Radix.
  - Has a clean camera capture and manual pan/zoom crop.
  - Has a print preview built on CSS grid.
  - Has no machine learning.

**Decision: no database, no backend, no VPS.**
- Every heavy step can run in the browser with WASM/WebGPU models: background removal and face landmarks.
- Crop, adjust, compliance checks, print sheets and export are Canvas work.
- That makes the app a static site, so GitHub Pages is enough.
- It also keeps things private, because photos never leave the device.
- **When a Hostinger VPS would be worth it:** only if you later want server-side models such as BiRefNet or alpha matting for higher-quality edges, accounts, or payments. It is not needed now.

**Name: Pixport** (pixel + passport). Tagline: *"Perfect passport photos. Right in your browser."*

## Tech stack
- Vite 7, React 19, TypeScript (strict), Tailwind CSS v4, zustand (with persist for preferences).
- UI primitives: Radix UI (Dialog, Slider, Tabs, Select, Popover), lucide-react icons, framer-motion for fluid transitions.
- Background removal: `@imgly/background-removal`. It is AGPL, which is fine for a public open-source repo.
  - Runs ONNX in the browser (WebGPU with a WASM fallback) and loads its model from the imgly CDN.
  - We reuse idify's progress-reporting pattern.
- Face analysis: `@mediapipe/tasks-vision` FaceLandmarker.
  - Its 468 landmarks give real eye line, chin, estimated crown, roll/yaw, and eyes-open signals from blendshapes.
  - This replaces photogen's guessed `0.83` factor.
- Other libraries: `react-easy-crop` (manual crop), `heic2any` (iPhone HEIC input), `jspdf` (PDF print sheets).
- Tooling: strict TypeScript, Vitest for the pure maths (crop, layout, export, specs), and a GitHub Actions deploy to Pages.

## App design (Apple-style UX)
- **Look and feel:**
  - System font stack (`-apple-system, SF Pro, Inter`).
  - Frosted-glass toolbars (`backdrop-blur`), 16–24px corner radii, soft shadows, generous white space.
  - Segmented controls, a single accent colour (blue #0A84FF), automatic light and dark mode, spring animations.
- **Layout:** one-screen studio.
  - Canvas in the centre.
  - Bottom tool dock on mobile, right-hand inspector panel on desktop.
  - Minimal chrome.
- **Two modes, shown on the home screen as two large cards:**
  1. **Passport Photo** (guided, 4 steps with a progress pill):
     - **Upload / Camera:** drag-drop, file picker or webcam with an oval face guide; HEIC supported.
     - **Choose document:** searchable country list with flags, grouped as Passport / Visa / ID, with the requirements summary card.
     - **Auto-magic:** remove background, then detect the face, then auto-crop to spec. The user sees a live compliance checklist and can fine-tune crop, background colour and adjustments.
     - **Export:** single photo (JPEG at spec size with 300-DPI metadata, or under the spec's size limit in KB) or a print sheet (4×6 in, 5×7 in, A4, Letter) as JPEG or PDF with cut marks.
  2. **Photo Editor** (free form):
     - Remove background; replace with a solid colour, gradient, blur or custom image; transparent PNG export.
     - Crop with aspect presets, rotate, flip.
     - Adjust brightness, contrast, saturation, warmth, exposure, sharpness and vignette.
     - Filter presets.
     - Before/after compare, undo/redo, resize and export.

## Project layout (new folder `pixport/` at the repo root)
```
pixport/
  PLAN.md                      # this plan, copied into the repo
  index.html, vite.config.ts   # base: '/pixport/' (from env VITE_BASE)
  .github/workflows/deploy.yml # build → actions/deploy-pages
  src/
    main.tsx, App.tsx          # HashRouter-free: zustand `route` state (Pages-safe)
    styles/index.css           # Tailwind v4 + design tokens (light/dark)
    data/specs.ts              # curated country specs (typed)
    types.ts
    store/                     # useEditorStore (image, mask, adjustments, history), usePassportStore (spec, crop, step), usePrefs (persist)
    lib/
      image/load.ts            # File/HEIC → ImageBitmap, EXIF orientation, downscale to ≤ 2400px
      image/adjust.ts          # canvas filters + per-pixel warmth/sharpen/vignette
      image/background.ts      # composite subject over colour/gradient/blur/image; mask cleanup (largest region + edge feather)
      image/export.ts          # toBlob, JPEG quality search to fit max KB, JFIF DPI patch, PNG
      ml/removeBackground.ts   # imgly wrapper, lazy-loaded, progress callback, cached result
      ml/face.ts               # FaceLandmarker singleton → {eyeY, chinY, crownY, cx, roll, yaw, eyesOpen}
      passport/autoCrop.ts     # head-height / eye-line crop math (ported from photogen cropping.py, using real crown–chin)
      passport/compliance.ts   # checks: face found, single face, head % in range, eye line in range, tilt < 5°, eyes open, bg uniformity, resolution
      print/layout.ts          # ported from photogen printSheet.ts (best orientation, margins, gutters)
      print/render.ts          # canvas sheet + cut marks → JPEG / jsPDF
    components/
      ui/                      # Button, SegmentedControl, Slider, Sheet, Card, Toast, ProgressRing (Apple-styled)
      layout/                  # TopBar, ToolDock, Inspector
      home/ModeCards.tsx
      upload/DropZone.tsx, CameraCapture.tsx
      passport/CountryPicker.tsx, RequirementsCard.tsx, CropOverlay.tsx (head oval + eye/chin guides), ComplianceList.tsx, ExportPanel.tsx, PrintSheetPreview.tsx
      editor/CanvasView.tsx, BackgroundPanel.tsx, AdjustPanel.tsx, CropPanel.tsx, FilterPanel.tsx, CompareSlider.tsx
  tests/                       # vitest: autoCrop, layout, export size search, specs validity
```

## Spec data (`src/data/specs.ts`)
- We write our own typed dataset:
  ```
  { id, country, iso2, docType: 'passport'|'visa'|'id', widthMm, heightMm, dpi,
    headHeight: [minMm, maxMm], eyeFromBottom: [minMm, maxMm] | fraction, background, maxKb?, notes[] }
  ```
- It starts with about 40 common specs: US passport/visa, India passport/visa/OCI/PAN/Aadhaar, UK, Schengen/EU countries, Canada, Australia, NZ, China visa, Japan, Korea, Singapore, Malaysia, UAE, Saudi Arabia, Brazil, Mexico, Russia, South Africa, Nigeria, Pakistan, Bangladesh, Philippines, Indonesia, Vietnam, Thailand, Turkey and others.
- The first entries come from photogen's JSON and rubypassport's `FORMATS`.
- A **Custom size** option lets the user enter mm/inches and a DPI.

## Core algorithm (auto-crop)
1. Run FaceLandmarker on the original image. From the landmarks, take:
   - `eyeY` = average of the iris centres;
   - `chinY` = landmark 152;
   - `crownY` = estimated by extending forehead landmark 10 upward by about 0.45 of the forehead-to-chin distance, then refined by checking the top edge of the background-removal mask above the face (the true top of the hair).
2. Target head height in px = `spec.headMid_mm / spec.heightMm × outH`, which gives `scale = targetHead / (chinY − crownY)`.
3. Place the eye line at `outH − eyeFromBottom_px`, centre horizontally on `cx`, and fill any area outside the source with the background.
4. Show the resulting crop box in `react-easy-crop` so the user can nudge it. Compliance checks re-run live.

## Performance and privacy
- Models load lazily on first use, with a friendly first-time download message.
- Heavy steps run off the main thread where possible; imgly already uses its own worker.
- Images are downscaled before running inference.
- Background-removal and face results are cached for each image.
- A "100% on-device, nothing is uploaded" badge makes the privacy promise visible.

## Deployment (GitHub Pages)
- In `vite.config.ts`, set `base: process.env.VITE_BASE ?? '/pixport/'`.
- Navigation uses in-app state rather than path routes, so there are no 404 problems on Pages.
- `.github/workflows/deploy.yml`:
  - on push to `main`: checkout, `npm ci`, `npm run build`, `actions/upload-pages-artifact` (`dist`), `actions/deploy-pages`.
  - The workflow sits at the repo root and uses `working-directory: pixport`, or at `pixport/.github` if `pixport` becomes its own repo. I'll initialise `pixport/` as its own git repo, since the reference folders already have their own `.git`.
- In GitHub, go to Settings → Pages → Source and choose "GitHub Actions".

## Implementation order
1. Scaffold Vite + TypeScript + Tailwind v4, set up design tokens and UI primitives, and add `PLAN.md`.
2. Build image loading (HEIC/EXIF), the DropZone, the camera, and the home mode cards.
3. Build the editor: canvas view, adjustments, crop/rotate/flip, undo/redo, compare, export.
4. Add background removal (imgly), the background replacement panel, and mask cleanup.
5. Add face landmarks, auto-crop and compliance checks, plus the passport wizard and country picker.
6. Add the print sheet (layout, render, PDF) and export with KB limits and DPI.
7. Polish: animations, dark mode, empty/loading/error states, a PWA manifest, and favicon/OG image.
8. Add Vitest tests, the GitHub Actions workflow, and a README.

## Verification
- `npm run build` and `npx tsc --noEmit` both pass cleanly.
- `npx vitest run` covers:
  - autoCrop: the synthetic landmark case puts the eye line and head % within spec tolerance;
  - print layout: 35×45 on 4×6 in gives the expected count;
  - export: the JPEG KB search stays under the limit;
  - every spec is valid.
- `npm run dev`, then a manual end-to-end check in the browser:
  - upload a portrait, then remove the background, then pick India, then auto-crop, then confirm the checklist is green, then download the JPEG (413×531, 300 DPI) and a 4×6 sheet PDF;
  - in editor mode, remove the background, then export a transparent PNG.
- `npm run build && npx vite preview --base /pixport/` confirms that asset paths work under the Pages sub-path.
