# Quick Start

This guide walks through registering the timeline editor in a Pict application, building a storyboard, getting the JSON back out, and wiring a media adapter for host-controlled image storage.

## Prerequisites

- A [Pict](https://fable-retold.github.io/pict/) application (or willingness to create a minimal one)
- Node.js

## Installation

```bash
npm install pict-editor-timeline
```

## Step 1: Register the View

The module's default export **is** the view class. Register it with your Pict instance and pass any configuration overrides. Everything has a sensible default, so an empty options object works too.

```javascript
const libPict = require('pict');
const libPictEditorTimeline = require('pict-editor-timeline');

let _Pict = new libPict({ Product: 'StoryboardDemo' });

_Pict.addView('Timeline',
	{
		DefaultDestinationAddress: '#TimelineEditor'
	},
	libPictEditorTimeline);
```

Your page needs a target element matching `DefaultDestinationAddress` (the default is `#PictEditorTimeline`):

```html
<div id="TimelineEditor"></div>
```

## Step 2: Initialize and Render

```javascript
_Pict.initialize();

let _Instance = _Pict.views.Timeline;
_Instance.render();
```

The view does not auto-initialize or auto-render (`AutoInitialize` and `AutoRender` are both `false` in the default configuration), so call `render()` yourself once the DOM is ready. An empty timeline shows a prompt to add the first cut.

> The view's `render()` is a no-op when there is no DOM (server-side or test contexts), and also when the destination element is not present yet.

## Step 3: Build a Timeline in Code (optional)

Users build timelines interactively, but you can also drive them from code. Every cut operation re-renders the editor.

```javascript
// Append a cut (-1 = end). Pass an index to insert after that cut.
_Instance.addCut(-1);

// Update a single field on the cut at an index.
_Instance.updateCut(0, 'prompt', 'A woman walks through a garden at golden hour');
_Instance.updateCut(0, 'target_seconds', 3);

// Duplicate a cut (deep copy, inserted immediately after).
_Instance.duplicateCut(0);

// Remove a cut by index.
_Instance.removeCut(1);
```

`updateCut()` deliberately does **not** re-render on its own - it is called on every keystroke from the prompt textarea, so re-rendering is left to the caller. `addCut()`, `removeCut()`, and `duplicateCut()` do re-render.

## Step 4: Seed From Existing JSON

To populate the editor from a saved storyboard, call `loadStoryboard()`. It accepts either a parsed array or a JSON string, replaces any existing cuts, and re-renders.

```javascript
_Instance.loadStoryboard(
	[
		{ prompt: 'Opening wide shot of the workshop', target_seconds: 3.5, beat_image: '/img/open.jpg' },
		{ prompt: 'Camera dollies in on the workbench', target_seconds: 2 },
		{ prompt: 'Close-up: the clockwork bird wakes', target_seconds: 1.5 }
	]);
```

The import accepts the same field names the export produces (`beat_image` for the start-frame reference) as well as the internal `start_image` name. See the [Data Model](data-model.md) for the full import behavior, including the legacy `extend_frames` conversion.

## Step 5: Get the Storyboard Back Out

```javascript
// Clean JSON array (internal fields stripped, start_image renamed to beat_image):
let tmpStoryboard = _Instance.getStoryboard();

// Same thing, serialized to a tab-indented JSON string:
let tmpJSON = _Instance.getStoryboardJSON();
```

Export -> import -> export is a clean round-trip and produces identical JSON. The exact schema is documented in the [Data Model](data-model.md).

The toolbar's **Copy JSON** button calls `getStoryboardJSON()` and writes the result to the clipboard (when `navigator.clipboard` is available).

## Using a Media Adapter

Out of the box, dropping an image into a start/end frame slot stores it as a `data:` URL directly on the cut. That works for a standalone editor with no backend.

To store images somewhere of your own (object storage, a CDN, an asset service) supply a **`MediaAdapter`** in the view options:

```javascript
_Pict.addView('Timeline',
	{
		DefaultDestinationAddress: '#TimelineEditor',
		MediaAdapter:
		{
			// Called when a user picks a file. Upload it, return a reference
			// string (path, GUID, URL) - the timeline stores it on the cut.
			// May return a value or a promise.
			onMediaProvided: async (pKind, pFile, pCutIndex, pSlot) =>
			{
				let tmpRef = await myUploader(pFile);
				return tmpRef;
			},

			// Convert a stored reference into a browser-displayable URL for
			// the slot's thumbnail. Default: return the reference unchanged.
			getMediaUrl: (pKind, pReference) =>
			{
				return pReference;
			},

			// Optional. When present, the slot shows a "Browse" chip. The host
			// opens its own picker and calls fCallback(reference) on select.
			onBrowseMedia: (pKind, pCutIndex, pSlot, fCallback) =>
			{
				myAssetPicker.open((pChosenRef) => fCallback(pChosenRef));
			},

			// Optional. Restricts which kinds show a Browse chip. Defaults to
			// all kinds when omitted.
			supportedKinds: [ 'image' ]
		}
	},
	libPictEditorTimeline);
```

The adapter callbacks receive a `pKind` string identifying the media type. Today that is always `'image'`; the interface is shaped to grow into `'audio'` and `'character'` slots later. `pSlot` is the cut field being filled (`'start_image'` or `'end_image'`), and `pCutIndex` is the cut's position.

### Legacy ImageAdapter

An older, image-only adapter shape is still honored. If you pass:

```javascript
ImageAdapter:
{
	onImageProvided: (pFile, pCutIndex, pSlot) => /* return a reference */,
	getThumbnailUrl: (pReference) => /* return a URL */
}
```

the view wraps it internally as a kind-aware `MediaAdapter` (with `pKind === 'image'`). Prefer `MediaAdapter` for new code.

## Configuration Reference

These options come from the view's default configuration; override any of them in the second argument to `addView`.

| Option | Default | Purpose |
|--------|---------|---------|
| `ViewIdentifier` | `'Pict-Editor-Timeline'` | Pict view identifier |
| `DefaultDestinationAddress` | `'#PictEditorTimeline'` | CSS selector for the mount element |
| `AutoInitialize` | `false` | Whether Pict initializes the view automatically |
| `AutoRender` | `false` | Whether Pict renders the view automatically |
| `DefaultCut` | `{ prompt: '', target_seconds: 2, start_image: '', end_image: '' }` | Field defaults for a newly added cut |
| `MaxCuts` | `50` | Intended cap on the number of cuts |
| `MinTargetSeconds` | `0.5` | Lower clamp for the duration stepper |
| `MaxTargetSeconds` | `30` | Upper clamp for the duration stepper |
| `FPS` | `16` | Frames per second used to convert legacy `extend_frames` on import |
| `CSSPriority` | `500` | Priority for the injected CSS in the Pict CSS cascade |
| `MediaAdapter` | `null` | Host media-storage adapter; `null` = built-in `data:` URL fallback |
| `ImageAdapter` | `null` | Legacy image-only adapter; auto-wrapped as a `MediaAdapter` |

> The duration steppers clamp to `MinTargetSeconds`/`MaxTargetSeconds` and step by 0.5s. `MaxCuts` is part of the configuration surface; the editor does not currently enforce a hard stop when adding cuts beyond it.

## Building for the Browser

```bash
npx quack build
```

This produces a UMD bundle in `dist/` for direct `<script>` inclusion, alongside the npm-requireable source tree.

## Next Steps

- **[Architecture](architecture.md)** - how the view and providers are wired
- **[Data Model](data-model.md)** - the cut object and the exported storyboard JSON schema
