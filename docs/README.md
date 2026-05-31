# Pict-Editor-Timeline

A visual timeline editor for building multi-beat video storyboards, built as a section view for the [Pict](https://fable-retold.github.io/pict/) application framework.

Users assemble an ordered list of **cuts**. Each cut carries a text prompt, a target duration in seconds, and optional start/end frame image references. The editor exports a clean JSON array that any downstream video-generation system can consume — the library itself stays completely decoupled from how that JSON is used.

## What It Does

`pict-editor-timeline` renders an editor where users can:

- **Add and remove cuts** with a single click
- **Reorder cuts** by dragging cards up and down the list
- **Duplicate a cut** to reuse its prompt, duration, and images as a starting point
- **Edit each cut's prompt** in an inline textarea
- **Adjust each cut's duration** with +/- steppers, clamped to a configurable range
- **Attach images** to a cut's start and end frame slots via a file picker (or a host-supplied asset browser)
- **See the total duration** and a proportional duration strip update live as the timeline changes
- **Export and import** the storyboard as JSON, with a clean round-trip

## How It Fits Together

The module is one Pict view backed by two providers:

- **`PictView-Timeline`** — the container view. It owns the public API (`getStoryboard()`, `loadStoryboard()`, the cut operations), builds the editor HTML, and delegates everything else to its providers.
- **`Pict-Provider-TimelineOps`** — the data model. It owns the cuts array and implements every mutation (add, remove, duplicate, update, move) plus storyboard import/export. It has no DOM knowledge.
- **`Pict-Provider-TimelineDragDrop`** — HTML5 drag-and-drop reordering. It tracks drag state, detects insert position, and calls the ops provider's `moveCut()`.

Each `PictView-Timeline` instance spins up its **own** ops and drag-drop providers, and the ops provider keeps its cuts in a per-instance array. Multiple timelines can coexist on one page with fully independent state — there is no shared `AppData` path.

See [Architecture](architecture.md) for the full breakdown.

## Key Concepts

### Cuts

A cut is the unit of the timeline — a single beat of the storyboard. Internally each cut is a plain object with an `id`, a `prompt`, a `target_seconds` duration, `start_image` and `end_image` references, and some transient UI state. The full shape is documented in the [Data Model](data-model.md).

### The Storyboard Export

`getStoryboard()` returns a clean array meant for a downstream worker. It strips internal fields and renames `start_image` to `beat_image`. This export format — not the internal cut shape — is the contract between the editor and whatever consumes it. See the [Data Model](data-model.md) for the exact schema.

### The Media Adapter

By default, dropping an image into a slot stores it as a `data:` URL right on the cut, so the editor works standalone with no backend. A host application can override this by supplying a **`MediaAdapter`** that uploads the file somewhere and returns a reference string (a path, a GUID, a URL). The adapter is also responsible for turning that reference back into a displayable thumbnail URL, and can optionally add a "Browse" chip that opens the host's own asset picker. See [Quick Start](quickstart.md#using-a-media-adapter).

## Quick Example

```javascript
const libPict = require('pict');
const libPictEditorTimeline = require('pict-editor-timeline');

let _Pict = new libPict({ Product: 'StoryboardDemo' });

_Pict.addView('Timeline',
	{
		DefaultDestinationAddress: '#TimelineEditor'
	},
	libPictEditorTimeline);

_Pict.initialize();

let _Instance = _Pict.views.Timeline;

_Instance.loadStoryboard(
	[
		{ prompt: 'Opening wide shot of the workshop', target_seconds: 3.5 },
		{ prompt: 'Camera dollies in on the workbench', target_seconds: 2 }
	]);

// ... user edits the timeline ...

let tmpStoryboard = _Instance.getStoryboard();
// => [ { prompt: '...', target_seconds: 3.5 }, { prompt: '...', target_seconds: 2 } ]
```

## Learn More

- **[Quick Start](quickstart.md)** — register the view, build a timeline, wire a media adapter
- **[Architecture](architecture.md)** — the view + providers design and how state stays per-instance
- **[Data Model](data-model.md)** — the cut object and the exported storyboard JSON schema

## Related Modules

`pict-editor-timeline` is part of the [Retold](https://github.com/fable-retold) module suite:

- [pict](https://fable-retold.github.io/pict/) — core MVC application framework
- [pict-view](https://fable-retold.github.io/pict-view/) — view base class (`PictView-Timeline` extends it)
- [pict-provider](https://fable-retold.github.io/pict-provider/) — provider base class (the ops and drag-drop providers extend it)

## License

MIT
