/**
 * Pict Provider: Timeline Drag and Drop
 *
 * Handles HTML5 drag-and-drop reordering of cuts in the timeline.
 * Follows the same pattern as pict-section-formeditor's
 * Pict-Provider-FormEditorDragDrop: tracks drag state, detects
 * insert position (before/after based on cursor Y), and delegates
 * the actual array mutation to TimelineOps.moveCut().
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */
const libPictProvider = require('pict-provider');

class PictProviderTimelineDragDrop extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'PictProviderTimelineDragDrop';

		// Set by parent view after construction
		this._ParentTimeline = null;

		// Current drag state
		this._DragState =
		{
			Active: false,
			SourceIndex: -1,
			TargetIndex: -1,
			InsertPosition: 'after'  // 'before' | 'after'
		};
	}

	/**
	 * Called from ondragstart on a cut's drag handle.
	 */
	onDragStart(pEvent, pCutIndex)
	{
		this._DragState.Active = true;
		this._DragState.SourceIndex = pCutIndex;

		if (pEvent && pEvent.dataTransfer)
		{
			pEvent.dataTransfer.effectAllowed = 'move';
			// Required for Firefox
			pEvent.dataTransfer.setData('text/plain', String(pCutIndex));
		}

		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.add('pet-dragging');
		}
	}

	/**
	 * Called from ondragover on each cut row. Detects whether the
	 * cursor is in the top or bottom half to determine insert
	 * position.
	 */
	onDragOver(pEvent, pCutIndex)
	{
		if (!this._DragState.Active)
		{
			return;
		}

		if (pEvent)
		{
			pEvent.preventDefault();
		}

		this._DragState.TargetIndex = pCutIndex;

		// Detect top/bottom half for insert indicator
		if (pEvent && pEvent.currentTarget)
		{
			let tmpRect = pEvent.currentTarget.getBoundingClientRect();
			let tmpMidpoint = tmpRect.top + (tmpRect.height / 2);
			this._DragState.InsertPosition = pEvent.clientY < tmpMidpoint ? 'before' : 'after';

			// Visual feedback
			pEvent.currentTarget.classList.remove('pet-drag-insert-before', 'pet-drag-insert-after');
			pEvent.currentTarget.classList.add(
				this._DragState.InsertPosition === 'before'
					? 'pet-drag-insert-before'
					: 'pet-drag-insert-after');
		}
	}

	/**
	 * Called from ondragleave on each cut row.
	 */
	onDragLeave(pEvent, pCutIndex)
	{
		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.remove(
				'pet-drag-insert-before',
				'pet-drag-insert-after');
		}
	}

	/**
	 * Called from ondrop on each cut row.
	 */
	onDrop(pEvent, pCutIndex)
	{
		if (pEvent)
		{
			pEvent.preventDefault();
		}

		if (!this._DragState.Active)
		{
			return;
		}

		let tmpFrom = this._DragState.SourceIndex;
		let tmpTo = pCutIndex;

		// Adjust for insert position
		if (this._DragState.InsertPosition === 'after')
		{
			tmpTo = tmpTo + 1;
		}

		// Adjust if moving downward (source removal shifts indices)
		if (tmpFrom < tmpTo)
		{
			tmpTo = tmpTo - 1;
		}

		if (this._ParentTimeline && this._ParentTimeline._TimelineOps)
		{
			this._ParentTimeline._TimelineOps.moveCut(tmpFrom, tmpTo);
		}

		this._resetDragState();

		// Re-render the timeline
		if (this._ParentTimeline)
		{
			this._ParentTimeline.render();
		}
	}

	/**
	 * Called from ondragend on the drag handle (fires even if drop
	 * was cancelled).
	 */
	onDragEnd(pEvent)
	{
		this._resetDragState();

		// Clean up any lingering CSS classes
		if (typeof document !== 'undefined')
		{
			let tmpEls = document.querySelectorAll('.pet-dragging, .pet-drag-insert-before, .pet-drag-insert-after');
			for (let i = 0; i < tmpEls.length; i++)
			{
				tmpEls[i].classList.remove('pet-dragging', 'pet-drag-insert-before', 'pet-drag-insert-after');
			}
		}
	}

	_resetDragState()
	{
		this._DragState.Active = false;
		this._DragState.SourceIndex = -1;
		this._DragState.TargetIndex = -1;
		this._DragState.InsertPosition = 'after';
	}
}

module.exports = PictProviderTimelineDragDrop;
module.exports.default_configuration = {};
