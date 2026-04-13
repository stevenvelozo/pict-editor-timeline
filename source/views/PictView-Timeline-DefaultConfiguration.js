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

	// Image adapter: null = use built-in data-URL adapter.
	// Host apps override with { onImageProvided, getThumbnailUrl }.
	ImageAdapter: null
};
