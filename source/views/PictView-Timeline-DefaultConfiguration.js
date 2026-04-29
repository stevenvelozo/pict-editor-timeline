/**
 * Default configuration for PictView-Timeline.
 *
 * @license MIT
 */
const libCSS = require('./PictView-Timeline-CSS.js');

module.exports =
{
	CSS: libCSS,
	ViewIdentifier: 'Pict-Editor-Timeline',

	DefaultRenderable: 'Timeline-Container',
	DefaultDestinationAddress: '#PictEditorTimeline',

	AutoInitialize: false,
	AutoInitializeOrdinal: 0,
	AutoRender: false,
	AutoRenderOrdinal: 0,
	AutoSolveWithApp: false,
	AutoSolveOrdinal: 0,

	CSSHash: 'View-Editor-Timeline',
	CSSPriority: 500,

	// Default values for newly-added cuts
	DefaultCut:
	{
		prompt: '',
		target_seconds: 2,
		start_image: '',
		end_image: ''
	},

	// Constraints
	MaxCuts: 50,
	MinTargetSeconds: 0.5,
	MaxTargetSeconds: 30,
	FPS: 16,

	// Media adapter: null = use built-in data-URL fallback for every
	// media kind. Host apps override with an object of the form:
	//
	// {
	//     onMediaProvided: async (pKind, pFile, pCutIndex, pSlot) => string,
	//     getMediaUrl:     (pKind, pReference) => string,
	//     onBrowseMedia:   (pKind, pCutIndex, pSlot, fCallback) => void (optional)
	// }
	//
	// pKind is a short string — 'image' today; 'audio' and
	// 'character' when those slot types land. The timeline falls back
	// to data-URL storage for any kind when no adapter is supplied,
	// so it works standalone with no host integration.
	MediaAdapter: null,

	// Legacy alias. If the host sets ImageAdapter (old-style
	// { onImageProvided, getThumbnailUrl }), the view wraps it as a
	// MediaAdapter automatically for backward compatibility.
	ImageAdapter: null
};
