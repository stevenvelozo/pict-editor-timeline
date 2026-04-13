/**
 * PictView-Timeline — Container View
 *
 * Main view for the timeline editor. Renders a vertical list of cut
 * cards with a toolbar at the top and a duration strip at the bottom.
 * All data mutations are delegated to the TimelineOps provider; drag
 * reordering is handled by the TimelineDragDrop provider.
 *
 * The view is designed to be embedded in any Pict application. It
 * stores its data at pict.AppData.Timeline.Cuts[] and exposes
 * getStoryboard() / loadStoryboard() for interop with downstream
 * systems like the retold-labs storyboard workflow.
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */
const libPictView = require('pict-view');

const libTimelineOps = require('../providers/Pict-Provider-TimelineOps.js');
const libTimelineDragDrop = require('../providers/Pict-Provider-TimelineDragDrop.js');

const libDefaultConfiguration = require('./PictView-Timeline-DefaultConfiguration.js');

class PictViewTimeline extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, libDefaultConfiguration, pOptions);
		super(pFable, tmpOptions, pServiceHash);

		this.serviceType = 'PictViewTimeline';

		// Create providers
		let tmpHash = pServiceHash || 'Timeline';

		this._TimelineOps = this.pict.addProvider(
			tmpHash + '-Ops',
			{},
			libTimelineOps);
		this._TimelineOps._ParentTimeline = this;

		this._DragDrop = this.pict.addProvider(
			tmpHash + '-DragDrop',
			{},
			libTimelineDragDrop);
		this._DragDrop._ParentTimeline = this;
	}

	// ================================================================
	// Public API
	// ================================================================

	/**
	 * Export the current timeline as a storyboard JSON array.
	 */
	getStoryboard()
	{
		return this._TimelineOps.getStoryboard();
	}

	/**
	 * Export as a JSON string.
	 */
	getStoryboardJSON()
	{
		return this._TimelineOps.getStoryboardJSON();
	}

	/**
	 * Load a storyboard into the timeline (replacing existing cuts).
	 * Accepts a parsed array or a JSON string. Re-renders after load.
	 */
	loadStoryboard(pStoryboard)
	{
		this._TimelineOps.loadStoryboard(pStoryboard);
		this.render();
	}

	// ================================================================
	// Cut operations (convenience wrappers that re-render)
	// ================================================================

	addCut(pAfterIndex)
	{
		this._TimelineOps.addCut(pAfterIndex);
		this.render();
	}

	removeCut(pIndex)
	{
		this._TimelineOps.removeCut(pIndex);
		this.render();
	}

	duplicateCut(pIndex)
	{
		this._TimelineOps.duplicateCut(pIndex);
		this.render();
	}

	updateCut(pIndex, pField, pValue)
	{
		this._TimelineOps.updateCut(pIndex, pField, pValue);
		// Don't re-render on every keystroke — debounce or let the
		// caller decide when to render.
	}

	// ================================================================
	// Rendering
	// ================================================================

	onBeforeRender()
	{
		// Ensure the data path exists
		this._TimelineOps.getCuts();
	}

	render(pRenderableHash, pRenderDestinationAddress)
	{
		let tmpDest = pRenderDestinationAddress || this.options.DefaultDestinationAddress;
		if (typeof document === 'undefined')
		{
			return;  // Server-side / test — no DOM
		}

		let tmpContainer = document.querySelector(tmpDest);
		if (!tmpContainer)
		{
			return;
		}

		let tmpCuts = this._TimelineOps.getCuts();
		let tmpTotal = this._TimelineOps.getTotalSeconds();
		let tmpViewRef = `window.pict.views['${this.Hash}']`;

		// Build HTML
		let tmpHTML = '';

		// ── Toolbar ──────────────────────────────────────────
		tmpHTML += '<div class="pet-toolbar">';
		tmpHTML += `<button class="pet-btn pet-btn-primary" onclick="${tmpViewRef}.addCut(-1)">+ Add Cut</button>`;
		tmpHTML += `<span class="pet-total-duration">${tmpCuts.length} cut${tmpCuts.length !== 1 ? 's' : ''} &middot; ${tmpTotal}s total</span>`;
		tmpHTML += `<button class="pet-btn" onclick="${tmpViewRef}._exportToClipboard()">Copy JSON</button>`;
		tmpHTML += '</div>';

		// ── Cuts list ────────────────────────────────────────
		tmpHTML += '<div class="pet-cuts-list">';
		if (tmpCuts.length === 0)
		{
			tmpHTML += '<div class="pet-empty-state">No cuts yet. Click <strong>+ Add Cut</strong> to start building your storyboard.</div>';
		}

		for (let i = 0; i < tmpCuts.length; i++)
		{
			let tmpCut = tmpCuts[i];
			let tmpDDRef = `window.pict.providers['${this._DragDrop.Hash}']`;

			tmpHTML += `<div class="pet-cut-card" data-cut-index="${i}"`;
			tmpHTML += ` draggable="true"`;
			tmpHTML += ` ondragstart="${tmpDDRef}.onDragStart(event,${i})"`;
			tmpHTML += ` ondragover="${tmpDDRef}.onDragOver(event,${i})"`;
			tmpHTML += ` ondragleave="${tmpDDRef}.onDragLeave(event,${i})"`;
			tmpHTML += ` ondrop="${tmpDDRef}.onDrop(event,${i})"`;
			tmpHTML += ` ondragend="${tmpDDRef}.onDragEnd(event)"`;
			tmpHTML += '>';

			// Drag handle + cut number
			tmpHTML += `<div class="pet-cut-handle" title="Drag to reorder">&#9776;</div>`;
			tmpHTML += `<div class="pet-cut-number">#${i + 1}</div>`;

			// Start image slot
			tmpHTML += '<div class="pet-cut-image-slot">';
			if (tmpCut.start_image)
			{
				let tmpThumbUrl = this._getThumbnailUrl(tmpCut.start_image);
				tmpHTML += `<img class="pet-cut-thumb" src="${tmpThumbUrl}" alt="Start frame" />`;
				tmpHTML += `<button class="pet-btn-tiny pet-btn-danger" onclick="${tmpViewRef}.updateCut(${i},'start_image','');${tmpViewRef}.render()">&times;</button>`;
			}
			else
			{
				tmpHTML += `<div class="pet-cut-dropzone" onclick="${tmpViewRef}._triggerImageUpload(${i},'start_image')">`;
				tmpHTML += '<span class="pet-dropzone-label">Start<br/>Frame</span>';
				tmpHTML += '</div>';
			}
			tmpHTML += '</div>';

			// Prompt + duration
			tmpHTML += '<div class="pet-cut-content">';
			tmpHTML += `<textarea class="pet-cut-prompt" rows="2" placeholder="Describe what happens in this cut..."`;
			tmpHTML += ` oninput="${tmpViewRef}.updateCut(${i},'prompt',this.value)"`;
			tmpHTML += `>${tmpCut.prompt || ''}</textarea>`;
			tmpHTML += '<div class="pet-cut-duration">';
			tmpHTML += `<button class="pet-btn-tiny" onclick="${tmpViewRef}._adjustDuration(${i},-0.5)">-</button>`;
			tmpHTML += `<span class="pet-duration-value">${tmpCut.target_seconds}s</span>`;
			tmpHTML += `<button class="pet-btn-tiny" onclick="${tmpViewRef}._adjustDuration(${i},0.5)">+</button>`;
			tmpHTML += '</div>';
			tmpHTML += '</div>';

			// End image slot
			tmpHTML += '<div class="pet-cut-image-slot">';
			if (tmpCut.end_image)
			{
				let tmpThumbUrl = this._getThumbnailUrl(tmpCut.end_image);
				tmpHTML += `<img class="pet-cut-thumb" src="${tmpThumbUrl}" alt="End frame" />`;
				tmpHTML += `<button class="pet-btn-tiny pet-btn-danger" onclick="${tmpViewRef}.updateCut(${i},'end_image','');${tmpViewRef}.render()">&times;</button>`;
			}
			else
			{
				tmpHTML += `<div class="pet-cut-dropzone" onclick="${tmpViewRef}._triggerImageUpload(${i},'end_image')">`;
				tmpHTML += '<span class="pet-dropzone-label">End<br/>Frame</span>';
				tmpHTML += '</div>';
			}
			tmpHTML += '</div>';

			// Action buttons
			tmpHTML += '<div class="pet-cut-actions">';
			tmpHTML += `<button class="pet-btn-tiny" title="Duplicate" onclick="${tmpViewRef}.duplicateCut(${i})">&#x2398;</button>`;
			tmpHTML += `<button class="pet-btn-tiny pet-btn-danger" title="Delete" onclick="${tmpViewRef}.removeCut(${i})">&times;</button>`;
			tmpHTML += '</div>';

			tmpHTML += '</div>'; // .pet-cut-card
		}
		tmpHTML += '</div>'; // .pet-cuts-list

		// ── Duration strip ───────────────────────────────────
		if (tmpCuts.length > 0 && tmpTotal > 0)
		{
			tmpHTML += '<div class="pet-duration-strip">';
			let tmpColors = ['#2d7d6e', '#6b4c8a', '#8a6b3d', '#3d6e8a', '#8a3d5c', '#3d8a5c', '#6e3d8a', '#8a8a3d'];
			for (let i = 0; i < tmpCuts.length; i++)
			{
				let tmpPct = ((tmpCuts[i].target_seconds || 0) / tmpTotal * 100).toFixed(1);
				let tmpColor = tmpColors[i % tmpColors.length];
				tmpHTML += `<div class="pet-duration-block" style="width:${tmpPct}%;background:${tmpColor}" title="Cut #${i + 1}: ${tmpCuts[i].target_seconds}s">`;
				tmpHTML += `<span class="pet-duration-block-label">${tmpCuts[i].target_seconds}s</span>`;
				tmpHTML += '</div>';
			}
			tmpHTML += '</div>';
		}

		// Hidden file input for image uploads
		tmpHTML += '<input type="file" id="pet-image-upload" accept="image/*" style="display:none" />';

		tmpContainer.innerHTML = tmpHTML;
	}

	// ================================================================
	// Internal helpers
	// ================================================================

	_adjustDuration(pIndex, pDelta)
	{
		let tmpCuts = this._TimelineOps.getCuts();
		if (pIndex < 0 || pIndex >= tmpCuts.length) return;

		let tmpMin = this.options.MinTargetSeconds || 0.5;
		let tmpMax = this.options.MaxTargetSeconds || 30;
		let tmpCurrent = parseFloat(tmpCuts[pIndex].target_seconds) || 2;
		let tmpNew = Math.round((tmpCurrent + pDelta) * 10) / 10;
		tmpNew = Math.max(tmpMin, Math.min(tmpMax, tmpNew));

		this._TimelineOps.updateCut(pIndex, 'target_seconds', tmpNew);
		this.render();
	}

	_getThumbnailUrl(pRef)
	{
		if (this.options.ImageAdapter && typeof this.options.ImageAdapter.getThumbnailUrl === 'function')
		{
			return this.options.ImageAdapter.getThumbnailUrl(pRef);
		}
		// Default: treat the reference as a URL/data-URL directly
		return pRef;
	}

	_triggerImageUpload(pCutIndex, pSlot)
	{
		if (typeof document === 'undefined') return;

		let tmpInput = document.getElementById('pet-image-upload');
		if (!tmpInput) return;

		let tmpSelf = this;
		tmpInput.onchange = function ()
		{
			if (!tmpInput.files || !tmpInput.files[0]) return;
			let tmpFile = tmpInput.files[0];

			if (tmpSelf.options.ImageAdapter && typeof tmpSelf.options.ImageAdapter.onImageProvided === 'function')
			{
				// Host app handles storage
				Promise.resolve(tmpSelf.options.ImageAdapter.onImageProvided(tmpFile, pCutIndex, pSlot))
					.then(function (pRef)
					{
						tmpSelf._TimelineOps.updateCut(pCutIndex, pSlot, pRef);
						tmpSelf.render();
					});
			}
			else
			{
				// Default: read as data URL
				let tmpReader = new FileReader();
				tmpReader.onload = function (e)
				{
					tmpSelf._TimelineOps.updateCut(pCutIndex, pSlot, e.target.result);
					tmpSelf.render();
				};
				tmpReader.readAsDataURL(tmpFile);
			}

			// Reset so the same file can be re-selected
			tmpInput.value = '';
		};

		tmpInput.click();
	}

	_exportToClipboard()
	{
		let tmpJSON = this.getStoryboardJSON();
		if (typeof navigator !== 'undefined' && navigator.clipboard)
		{
			navigator.clipboard.writeText(tmpJSON);
		}
	}
}

module.exports = PictViewTimeline;
module.exports.default_configuration = libDefaultConfiguration;
