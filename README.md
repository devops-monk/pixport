# Pixport

**Passport photos, done right — right in your browser.**

Pixport makes passport, visa and ID photos for 33 countries (45 documents), and doubles as a simple photo editor. Everything runs on your device: photos are never uploaded, and there is no backend or database.

## Features

**Passport photo**
- Upload a photo (JPEG, PNG, WebP, HEIC) or take one with the camera, with an on-screen face guide
- Pick a country and document, or enter a custom size
- The background is removed and replaced with the colour the country requires
- The face is found automatically, levelled, and cropped so head height and eye line match the rules in millimetres
- Live checks: head size, eye height, space above the head, centring, tilt, facing the camera, eyes open, neutral expression, background and resolution
- Download the exact-size JPEG (with 300 dpi metadata and compressed under upload limits such as 240 KB) or PNG
- Print sheets for 4×6 in, 5×7 in, A4 and Letter as JPEG or PDF, with cut lines

**Photo editor**
- Remove the background, then keep it transparent or replace it with a colour, gradient, blur or another image
- Crop to common shapes, rotate and flip
- Exposure, brightness, contrast, saturation, warmth, tint, sharpness and vignette
- Filters, hold-to-compare, and undo/redo (⌘Z / ⇧⌘Z)
- Export PNG, JPEG or WebP at full or reduced size

## How it works

| Task | How |
| --- | --- |
| Background removal | [`@imgly/background-removal`](https://github.com/imgly/background-removal-js) (ONNX in the browser, WebGPU or WASM). The model downloads once from the imgly CDN and is cached by the browser. |
| Face landmarks | [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) (478 landmarks + blendshapes) |
| Crop maths | `src/lib/passport/autoCrop.ts` — solves head size and eye height inside each spec's ranges |
| Compliance checks | `src/lib/passport/compliance.ts` |
| Print layout | `src/lib/print/` — picks upright or rotated tiling, whichever fits more |
| Specs | `src/data/specs.ts` |

Stack: React 19, TypeScript, Vite, Tailwind CSS v4, zustand, motion, react-easy-crop, jsPDF.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (vitest)
npm run build      # production build in dist/
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds with the right base path and publishes to GitHub Pages.

One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

The site is served at **https://pixport.devops-monk.com/** (custom domain from `public/CNAME`; the DNS record is a CNAME to `devops-monk.github.io`). In **Settings → Pages**, set the custom domain to `pixport.devops-monk.com` and tick **Enforce HTTPS** once the certificate is issued.

## Disclaimer

Photo rules change and offices differ. Pixport's specs are a best effort — always check the official requirements before you submit a photo.

## Licence

AGPL-3.0, because the background-removal library is AGPL-licensed.
