# pict-editor-timeline — Design Spec

## Purpose

A standalone Pict view library that renders a visual timeline editor
for building multi-beat video storyboards. Users add, remove, reorder,
and configure "cuts" — each cut has a text prompt, a duration, and
optional start/end frame image slots. The editor exports a JSON array
that any downstream system (retold-labs, ComfyUI, a CLI tool) can
consume without knowing about the editor.

The library has **zero knowledge** of retold-labs, Ultravisor, model
weights, or video generation. It is a pure UI component for
assembling a sequence of annotated time segments with optional image
references.

## Module location

```
retold/modules/pict/pict-editor-timeline/
```

Standard Pict ecosystem module alongside `pict-section-form`,
`pict-section-formeditor`, `pict-provider-list`, etc.

## Data model

The timeline editor operates on a single data structure: an ordered
array of **cuts**. Each cut is a plain object:

```javascript
{
    // Identity
    id: "cut-0",                      // Auto-assigned, stable across reorders

    // Content
    prompt: "A woman walks through a garden at golden hour",
    target_seconds: 3,

    // Image references (opaque strings — could be file paths,
    // data URLs, LabAsset GUIDs, or anything the host app provides)
    start_image: "",                  // First frame reference
    end_image: "",                    // Last frame reference (optional)

    // UI state (not exported)
    _collapsed: false,
    _dragOver: false
}
```

### Export format

The `getStoryboard()` method returns a clean JSON array with only the
fields the storyboard workflow consumes:

```json
[
    {
        "prompt": "A woman walks through a garden at golden hour",
        "target_seconds": 3,
        "beat_image": "/path/to/garden.jpg"
    },
    {
        "prompt": "She bends down to pick a flower",
        "target_seconds": 2
    }
]
```

Mapping: `start_image` → `beat_image` (the storyboard worker's
field name). `end_image` is advisory — it helps the user visualize
the transition but doesn't affect generation today. When VACE
extension mode eventually supports end-frame targeting, the field
is ready.

### Import format

The `loadStoryboard(jsonArray)` method accepts the same format and
populates the timeline from it. Round-trip: export → import →
export produces identical JSON.

## Architecture

### File structure

```
pict-editor-timeline/
├── package.json
├── .quackage.json
├── source/
│   ├── Pict-Section-Timeline.js           # Main export
│   ├── views/
│   │   ├── PictView-Timeline.js           # Container view: renders the full editor
│   │   ├── PictView-Timeline-Cut.js       # Per-cut row: prompt, duration, image slots
│   │   └── PictView-Timeline-Toolbar.js   # Top bar: add cut, import/export, total duration
│   ├── providers/
│   │   ├── Pict-Provider-TimelineDragDrop.js   # HTML5 drag-and-drop reordering
│   │   └── Pict-Provider-TimelineOps.js        # Data mutations (add, remove, reorder, update)
│   └── templates/
│       ├── timeline-container.html
│       ├── timeline-cut.html
│       └── timeline-toolbar.html
├── test/
│   └── Pict-Timeline_tests.js
└── docs/
    └── README.md
```

### View hierarchy

```
PictView-Timeline (container)
├── PictView-Timeline-Toolbar
│   ├── [+ Add Cut] button
│   ├── [Import JSON] button
│   ├── [Export JSON] button
│   └── Total duration display (sum of all cuts' target_seconds)
│
├── PictView-Timeline-Cut (repeated per cut, vertical list)
│   ├── Drag handle (≡)
│   ├── Cut number badge (#1, #2, ...)
│   ├── Start frame image slot (drop zone / upload / paste)
│   ├── Prompt textarea
│   ├── Duration control (target_seconds, number input with +/- steppers)
│   ├── End frame image slot (drop zone / upload / paste, optional)
│   ├── [Duplicate] [Delete] buttons
│   └── Collapse/expand toggle
│
└── Visual timeline strip (bottom, read-only)
    └── Proportional-width color blocks per cut showing relative durations
```

### Provider pattern

Following `pict-section-formeditor` exactly:

**PictView-Timeline** (main view):
- Extends `libPictView`
- In constructor: creates `TimelineDragDrop` and `TimelineOps`
  providers via `this.pict.addProvider()`
- Each `TimelineOps` provider owns its own cuts array in
  `this._Cuts` — multiple timeline instances on the same page have
  fully independent state. No shared `pict.AppData` path.
- Renders by iterating over cuts and emitting per-cut HTML
- Exposes `getStoryboard()` and `loadStoryboard()` on its own instance
  (host apps access via their stored view reference)

**Pict-Provider-TimelineDragDrop**:
- Extends `libPictProvider`
- Tracks `_DragState` with source cut index
- Implements `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`
- Uses top/bottom half detection for insert-before/insert-after
- Calls `this._ParentTimeline.render()` after reorder

**Pict-Provider-TimelineOps**:
- Extends `libPictProvider`
- `addCut(afterIndex)` — insert a new cut with defaults
- `removeCut(index)` — remove and re-index
- `duplicateCut(index)` — deep-copy + insert after
- `updateCut(index, field, value)` — update a single field
- `moveCut(fromIndex, toIndex)` — reorder (called by drag-drop)
- Always calls `this._ParentTimeline.render()` after mutations

### Image slot design

Each cut has two image slots: start frame and end frame. The slots
are generic drop zones that support three input methods:

1. **Click to browse** — triggers a hidden `<input type="file">`
2. **Drag-and-drop** — accepts image files dropped from Finder/Explorer
3. **Paste** — accepts clipboard image data (Ctrl/Cmd+V when focused)

When an image is provided via any method, the slot:
- Shows a thumbnail preview (resized client-side for display)
- Stores the image reference in the cut data

**The media reference format depends on the host app's adapter:**

| Host | start_image / end_image value |
|---|---|
| Standalone (no adapter) | Data URL (`data:image/png;base64,...`) |
| retold-labs adapter | Materialized asset path (`/path/to/materialized/GUID/file.jpg`) |
| CLI tool | Filesystem path (`./images/garden.jpg`) |

The timeline editor ships with a default data-URL fallback for every
media kind. The host app overrides this by setting
`options.MediaAdapter` to an object with:

```javascript
{
    // Required unless you want data-URL fallback.
    // pKind is a short string: 'image' today; 'audio' and
    // 'character' when those slot types land. pSlot is the cut
    // field name ('start_image', 'end_image', 'audio', ...).
    // Return a reference string the timeline stores on the cut.
    onMediaProvided: async (pKind, pFile, pCutIndex, pSlot) => {
        // Upload to storage, return a reference string
        return "/path/to/stored/image.jpg";
    },

    // Convert a stored reference into a URL the browser can render
    // (for images: <img src>; for audio: <audio src>; ...).
    // Default: return the reference as-is (works for data: URLs
    // and public http URLs).
    getMediaUrl: (pKind, pReference) => {
        return pReference;
    },

    // Optional: when defined, the timeline renders a "Browse" chip
    // next to the upload drop zone for that slot. The host opens
    // its own picker UI and calls fCallback with the chosen ref.
    onBrowseMedia: (pKind, pCutIndex, pSlot, fCallback) => {
        // ... show asset picker, on select: fCallback(ref)
    },

    // Optional: list supported media kinds (the timeline only
    // shows a Browse chip for kinds in this list). Defaults to
    // "all kinds" when omitted.
    supportedKinds: ['image']
}
```

### Backward compatibility

The previous `ImageAdapter` option is still honored. A host that
passes `ImageAdapter: { onImageProvided, getThumbnailUrl }` is
wrapped internally as a kind-aware `MediaAdapter` with `pKind ===
'image'`. The default data-URL fallback is unchanged, so every
existing standalone deployment continues to work.

### CSS approach

Dark theme by default (matching retold-labs). All classes prefixed
with `pet-` (Pict Editor Timeline). CSS injected via the PictView
`CSS` option so it's included in the Pict CSS cascade without
external stylesheets.

Key visual elements:
- Timeline container: vertical stack of cut cards
- Cut card: horizontal layout with drag handle | image | prompt | duration | image
- Image slots: dashed-border drop zones, thumbnail preview when populated
- Duration strip: horizontal bar at the bottom, each cut proportional to its duration
- Drag feedback: ghost opacity on drag source, insertion indicator on target

### Default configuration

```javascript
module.exports = {
    ViewIdentifier: 'Pict-Editor-Timeline',
    DefaultRenderable: 'Timeline-Container',
    DefaultDestinationAddress: '#PictEditorTimeline',
    AutoInitialize: false,
    AutoRender: false,
    CSS: '/* ... */',
    CSSHash: 'View-Editor-Timeline',
    CSSPriority: 500,
    DefaultCut: {
        prompt: '',
        target_seconds: 2,
        start_image: '',
        end_image: ''
    },
    MaxCuts: 50,
    MinTargetSeconds: 0.5,
    MaxTargetSeconds: 30,
    MediaAdapter: null,  // null = data-URL fallback for every kind
    ImageAdapter: null   // legacy alias; auto-wrapped as MediaAdapter
};
```

## retold-labs integration (separate from pict-editor-timeline)

When retold-labs imports the timeline editor, it provides:

1. A `MediaAdapter` that wires image slots to the existing
   asset-picker widget (upload → Parime → materialized path), and
   an `onBrowseMedia` hook that opens a LabAssets search popover so
   users can pick from previously uploaded/generated assets
2. A "Generate" button in the toolbar that serializes the timeline
   to the storyboard format and POSTs it to the storyboard API
3. A route (`#/timeline`) and nav item ("Timeline") in the sidebar

This integration code lives in retold-labs, NOT in
pict-editor-timeline. The library stays decoupled.

```javascript
// In PictView-RetoldLabs-ExperimentRunner.js:
const libPictEditorTimeline = require('pict-editor-timeline');

this.pict.addView('Timeline-Editor', Object.assign(
    {},
    libPictEditorTimeline.default_configuration,
    {
        DefaultDestinationAddress: '#RetoldLabs-View-Timeline',
        MediaAdapter: {
            onMediaProvided: async (kind, file, cutIndex, slot) => {
                // Upload to Parime, return materialized path
            },
            getMediaUrl: (kind, ref) => {
                // Return a browser-displayable URL for thumbnails
                return ref;
            },
            onBrowseMedia: (kind, cutIndex, slot, cb) => {
                // Open asset search popover, call cb(ref) on select
            }
        }
    }),
    libPictEditorTimeline);
```

The same adapter surface is reused for upcoming **audio** slots
(`kind === 'audio'`) and **character reference** imagery
(`kind === 'character'`).

## Build and test

### Build
```bash
npx quack build
```
Produces `dist/pict-editor-timeline.js` (UMD bundle) for direct
`<script>` inclusion, plus the npm-requireable source tree.

### Test
```bash
npm test
```
Mocha TDD tests covering:
- Data model: add/remove/reorder/duplicate/update cuts
- Export: getStoryboard() produces correct JSON
- Import: loadStoryboard() round-trips cleanly
- Duration math: total duration updates on add/remove/change
- Validation: prompt required, target_seconds in range

No browser tests in the library itself — the visual testing happens
in retold-labs' browser integration suite after integration.

## Implementation order

1. **Scaffold**: package.json, .quackage.json, directory structure
2. **Data model + ops provider**: cut CRUD, reorder, export/import
3. **Unit tests**: data model round-trip, duration math
4. **Container view + toolbar**: render shell, add/export buttons
5. **Cut view**: prompt textarea, duration control, image slots
6. **Drag-and-drop provider**: reorder cuts by dragging
7. **Image adapter**: default data-URL adapter, slot thumbnails
8. **Duration strip**: proportional-width visual timeline at bottom
9. **CSS**: dark theme, drag feedback, responsive layout
10. **retold-labs integration**: ImageAdapter, route, nav item, Generate button
