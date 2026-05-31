# pict-editor-timeline

A standalone [Pict](https://fable-retold.github.io/pict/) view library that renders a visual timeline editor for building multi-beat video storyboards.

Users add, remove, reorder, and configure **cuts** — each cut has a text prompt, a duration in seconds, and optional start/end frame image slots. The editor exports a clean JSON array that any downstream system (a video-generation API, a CLI tool, a workflow engine) can consume without knowing anything about the editor itself.

The library has **zero knowledge** of any specific video-generation backend. It is a pure UI component for assembling a sequence of annotated time segments with optional image references.

## Install

```bash
npm install pict-editor-timeline
```

## Quick Start

```javascript
const libPict = require('pict');
const libPictEditorTimeline = require('pict-editor-timeline');

let _Pict = new libPict({ Product: 'StoryboardDemo' });

// The default export is the view class; pass its default_configuration.
_Pict.addView('Timeline',
	{
		DefaultDestinationAddress: '#TimelineEditor'
	},
	libPictEditorTimeline);

_Pict.initialize();

let _Instance = _Pict.views.Timeline;
_Instance.render();

// Seed it with beats, or let the user build them by hand:
_Instance.loadStoryboard(
	[
		{ prompt: 'A woman walks through a garden at golden hour', target_seconds: 3 },
		{ prompt: 'She bends down to pick a flower', target_seconds: 2 }
	]);

// Pull the clean storyboard JSON back out when you are ready:
let tmpStoryboard = _Instance.getStoryboard();
```

Your page needs a target element matching `DefaultDestinationAddress`:

```html
<div id="TimelineEditor"></div>
```

## What You Get

- A toolbar with an **Add Cut** button, a live cut-count / total-duration readout, and a **Copy JSON** button.
- A vertical list of **cut cards** — drag handle, cut number, start-frame slot, prompt textarea, duration stepper, end-frame slot, and duplicate/delete buttons.
- HTML5 **drag-and-drop reordering** of cuts.
- A read-only **duration strip** at the bottom: proportional-width color blocks showing each cut's relative length.
- **Image slots** that accept a click-to-browse file picker, with a pluggable media adapter for host-controlled storage.
- A dark theme by default, recolorable through `--theme-color-*` custom properties.

## Documentation

Full documentation lives in [`docs/`](docs/README.md):

- [Overview](docs/README.md)
- [Quick Start](docs/quickstart.md)
- [Architecture](docs/architecture.md)
- [Data Model](docs/data-model.md) — the exported storyboard JSON schema

A deeper design spec is in [`DESIGN.md`](DESIGN.md).

## Testing

```bash
npm test
```

Mocha TDD tests cover the data model in isolation from the DOM: cut CRUD, reorder, duration math, export/import round-trip, unique IDs, and multi-instance isolation.

## Building

```bash
npx quack build
```

Produces a browser bundle in `dist/` alongside the npm-requireable source tree.

## Related Modules

- [pict](https://fable-retold.github.io/pict/) — the core MVC application framework this view plugs into
- [pict-view](https://fable-retold.github.io/pict-view/) — the view base class `PictView-Timeline` extends
- [pict-provider](https://fable-retold.github.io/pict-provider/) — the provider base class the ops and drag-drop providers extend

## License

MIT
