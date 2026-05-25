// Application Code for the Timeline Editor playground.
//
// `Base` is the synthesized PictApplication wrapper that registers
// the Timeline view from your Pict Config (under `TimelineViewConfig`).
// Return a class that extends `Base` to customize lifecycle hooks or
// register additional views/providers.
//
// The wrapper is generated at runtime — there is no per-module
// Application class to look at; the iframe builds it from the
// WrapperKind: "view" declaration in _playground.json.
//
// pict-editor-timeline stores its cuts inside the TimelineOps provider
// instance (not in AppData), so to seed the editor with the contents
// of `Initial AppData` we hand it to the view's loadStoryboard() API
// after the first render. The view re-renders itself when the
// storyboard loads, so the cards appear immediately.
//
return class extends Base
{
	onAfterInitialize()
	{
		super.onAfterInitialize();

		let tmpView = this.pict.views.Timeline;
		let tmpSeed = this.pict.AppData
			&& this.pict.AppData.Timeline
			&& this.pict.AppData.Timeline.Cuts;

		if (tmpView && Array.isArray(tmpSeed) && tmpSeed.length > 0)
		{
			// loadStoryboard accepts the same beat shape the view
			// exports, so AppData.Timeline.Cuts round-trips cleanly.
			tmpView.loadStoryboard(tmpSeed);
		}

		console.log('[playground] Timeline seeded with',
			(tmpSeed || []).length, 'cuts');
	}
};
