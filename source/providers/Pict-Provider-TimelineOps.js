/**
 * Pict Provider: Timeline Operations
 *
 * Pure data-model provider for the timeline editor. Handles all cut
 * mutations (add, remove, duplicate, reorder, update) and
 * import/export of the storyboard JSON format. Has no DOM
 * knowledge — the parent view calls render() after any mutation.
 *
 * Each provider instance owns its own cuts array in this._Cuts so
 * multiple PictView-Timeline instances on the same page have
 * independent state. Each cut is a plain object with: id, prompt,
 * target_seconds, start_image, end_image, plus transient UI state
 * (_collapsed, _dragOver) that is stripped on export.
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */
const libPictProvider = require('pict-provider');

const DEFAULT_CUT =
{
	prompt: '',
	target_seconds: 2,
	start_image: '',
	end_image: ''
};

class PictProviderTimelineOps extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'PictProviderTimelineOps';

		// The parent PictView-Timeline sets this after construction
		this._ParentTimeline = null;

		// Running counter for unique cut IDs (survives reorders)
		this._NextCutId = 0;

		// Per-instance cut storage. Each provider owns its own cuts
		// array, so multiple timelines on the same page (e.g. one per
		// value-input in the ExperimentRunner form) never share state.
		this._Cuts = [];
	}

	// ================================================================
	// Accessors
	// ================================================================

	/**
	 * Return the live cuts array for this provider instance.
	 */
	getCuts()
	{
		if (!Array.isArray(this._Cuts))
		{
			this._Cuts = [];
		}
		return this._Cuts;
	}

	/**
	 * Total duration in seconds across all cuts.
	 */
	getTotalSeconds()
	{
		let tmpCuts = this.getCuts();
		let tmpTotal = 0;
		for (let i = 0; i < tmpCuts.length; i++)
		{
			tmpTotal += (parseFloat(tmpCuts[i].target_seconds) || 0);
		}
		return Math.round(tmpTotal * 10) / 10;
	}

	/**
	 * Number of cuts.
	 */
	getCutCount()
	{
		return this.getCuts().length;
	}

	// ================================================================
	// Mutations
	// ================================================================

	/**
	 * Create a new cut object with default values and a unique ID.
	 */
	_newCut(pOverrides)
	{
		let tmpCut = Object.assign(
			{},
			DEFAULT_CUT,
			this._ParentTimeline && this._ParentTimeline.options
				? (this._ParentTimeline.options.DefaultCut || {})
				: {},
			pOverrides || {},
			{
				id: 'cut-' + this._NextCutId++,
				_collapsed: false,
				_dragOver: false
			});
		return tmpCut;
	}

	/**
	 * Add a new cut after the given index (-1 = append to end).
	 * Returns the new cut.
	 */
	addCut(pAfterIndex)
	{
		let tmpCuts = this.getCuts();
		let tmpCut = this._newCut();

		if (typeof pAfterIndex === 'number' && pAfterIndex >= 0 && pAfterIndex < tmpCuts.length)
		{
			tmpCuts.splice(pAfterIndex + 1, 0, tmpCut);
		}
		else
		{
			tmpCuts.push(tmpCut);
		}

		return tmpCut;
	}

	/**
	 * Remove the cut at the given index.
	 * Returns the removed cut or null.
	 */
	removeCut(pIndex)
	{
		let tmpCuts = this.getCuts();
		if (pIndex < 0 || pIndex >= tmpCuts.length)
		{
			return null;
		}
		return tmpCuts.splice(pIndex, 1)[0];
	}

	/**
	 * Deep-copy the cut at the given index and insert it immediately after.
	 * Returns the new (duplicate) cut.
	 */
	duplicateCut(pIndex)
	{
		let tmpCuts = this.getCuts();
		if (pIndex < 0 || pIndex >= tmpCuts.length)
		{
			return null;
		}
		let tmpSource = tmpCuts[pIndex];
		let tmpCopy = this._newCut(
			{
				prompt: tmpSource.prompt,
				target_seconds: tmpSource.target_seconds,
				start_image: tmpSource.start_image,
				end_image: tmpSource.end_image
			});
		tmpCuts.splice(pIndex + 1, 0, tmpCopy);
		return tmpCopy;
	}

	/**
	 * Update a single field on the cut at the given index.
	 */
	updateCut(pIndex, pField, pValue)
	{
		let tmpCuts = this.getCuts();
		if (pIndex < 0 || pIndex >= tmpCuts.length)
		{
			return;
		}
		tmpCuts[pIndex][pField] = pValue;
	}

	/**
	 * Move a cut from one index to another. Handles the splice
	 * arithmetic so the caller doesn't have to.
	 */
	moveCut(pFromIndex, pToIndex)
	{
		let tmpCuts = this.getCuts();
		if (pFromIndex < 0 || pFromIndex >= tmpCuts.length)
		{
			return;
		}
		if (pToIndex < 0)
		{
			pToIndex = 0;
		}
		if (pToIndex >= tmpCuts.length)
		{
			pToIndex = tmpCuts.length - 1;
		}
		if (pFromIndex === pToIndex)
		{
			return;
		}

		let tmpCut = tmpCuts.splice(pFromIndex, 1)[0];
		tmpCuts.splice(pToIndex, 0, tmpCut);
	}

	// ================================================================
	// Import / Export
	// ================================================================

	/**
	 * Export the timeline as a clean JSON array matching the
	 * storyboard workflow's beat format. Strips internal UI state
	 * (_collapsed, _dragOver, id) and maps field names to what the
	 * storyboard worker expects.
	 */
	getStoryboard()
	{
		let tmpCuts = this.getCuts();
		let tmpBeats = [];

		for (let i = 0; i < tmpCuts.length; i++)
		{
			let tmpCut = tmpCuts[i];
			let tmpBeat =
			{
				prompt: tmpCut.prompt || ''
			};

			// Duration: prefer target_seconds
			let tmpSeconds = parseFloat(tmpCut.target_seconds);
			if (tmpSeconds > 0)
			{
				tmpBeat.target_seconds = tmpSeconds;
			}

			// Image: start_image maps to beat_image (the storyboard
			// worker's field name for the per-beat reference image).
			// Only include non-empty strings.
			if (tmpCut.start_image)
			{
				tmpBeat.beat_image = tmpCut.start_image;
			}

			// end_image is advisory today — stored for future VACE
			// end-frame targeting but not consumed by the worker yet.
			if (tmpCut.end_image)
			{
				tmpBeat.end_image = tmpCut.end_image;
			}

			tmpBeats.push(tmpBeat);
		}

		return tmpBeats;
	}

	/**
	 * Serialize the storyboard to a JSON string.
	 */
	getStoryboardJSON()
	{
		return JSON.stringify(this.getStoryboard(), null, '\t');
	}

	/**
	 * Load a storyboard JSON array into the timeline, replacing any
	 * existing cuts. Accepts either a parsed array or a JSON string.
	 */
	loadStoryboard(pStoryboard)
	{
		let tmpBeats = pStoryboard;
		if (typeof tmpBeats === 'string')
		{
			try
			{
				tmpBeats = JSON.parse(tmpBeats);
			}
			catch (e)
			{
				this.log.error('TimelineOps: failed to parse storyboard JSON: ' + e.message);
				return;
			}
		}

		if (!Array.isArray(tmpBeats))
		{
			this.log.error('TimelineOps: storyboard must be an array');
			return;
		}

		// Clear existing cuts (per-instance state)
		this._Cuts = [];
		this._NextCutId = 0;

		for (let i = 0; i < tmpBeats.length; i++)
		{
			let tmpBeat = tmpBeats[i];
			this.addCut(-1);
			let tmpCut = this.getCuts()[this.getCuts().length - 1];
			tmpCut.prompt = tmpBeat.prompt || '';
			tmpCut.target_seconds = parseFloat(tmpBeat.target_seconds) || parseFloat(tmpBeat.extend_frames ? (tmpBeat.extend_frames / 16).toFixed(1) : 0) || 2;
			tmpCut.start_image = tmpBeat.beat_image || tmpBeat.start_image || '';
			tmpCut.end_image = tmpBeat.end_image || '';
		}
	}
}

module.exports = PictProviderTimelineOps;
module.exports.default_configuration = {};
