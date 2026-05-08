/**
 * CSS for the timeline editor — adapts to the host app's theme
 * via CSS custom properties. Exported as a string; PictView
 * injects it via the CSSMap.
 */
module.exports = `
/* ── Timeline container ─────────────────────────────── */
.pet-toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 0;
	border-bottom: 1px solid var(--border, #2a3a3a);
	margin-bottom: 12px;
}

.pet-total-duration {
	flex: 1;
	text-align: right;
	color: var(--text-muted, #8ca0a0);
	font-size: 0.9em;
}

.pet-btn {
	padding: 6px 14px;
	border: 1px solid var(--border, #3a4a4a);
	border-radius: 4px;
	background: var(--bg-secondary, #1a2a2a);
	color: var(--text-primary, #d0dada);
	cursor: pointer;
	font-size: 0.85em;
}
.pet-btn:hover {
	background: var(--bg-card, #2a3a3a);
}
.pet-btn-primary {
	background: var(--accent, #1a6a5a);
	border-color: var(--accent-light, #2a8a7a);
	color: var(--theme-color-background-panel, #fff);
}
.pet-btn-primary:hover {
	background: var(--accent-light, #2a8a7a);
}

/* ── Cuts list ──────────────────────────────────────── */
.pet-cuts-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.pet-empty-state {
	padding: 40px 20px;
	text-align: center;
	color: var(--text-muted, #6a8080);
	font-size: 0.95em;
}

/* ── Cut card ───────────────────────────────────────── */
.pet-cut-card {
	display: flex;
	align-items: stretch;
	gap: 8px;
	padding: 8px;
	background: var(--bg-card, #162222);
	border: 1px solid var(--border, #2a3a3a);
	border-radius: 6px;
	transition: opacity 0.15s, border-color 0.15s;
}
.pet-cut-card:hover {
	border-color: var(--accent, #3a5a5a);
}

.pet-dragging {
	opacity: 0.4;
}
.pet-drag-insert-before {
	border-top: 3px solid var(--accent, #2a8a7a) !important;
}
.pet-drag-insert-after {
	border-bottom: 3px solid var(--accent, #2a8a7a) !important;
}

/* Drag handle */
.pet-cut-handle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	min-height: 60px;
	cursor: grab;
	color: var(--text-muted, #4a6060);
	font-size: 14px;
	user-select: none;
}
.pet-cut-handle:hover {
	color: var(--text-secondary, #8ca0a0);
}

/* Cut number badge */
.pet-cut-number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	color: var(--text-muted, #5a7070);
	font-size: 0.8em;
	font-weight: bold;
}

/* ── Image slots ────────────────────────────────────── */
.pet-cut-image-slot {
	position: relative;
	width: 80px;
	min-height: 60px;
	flex-shrink: 0;
}

.pet-cut-dropzone {
	width: 100%;
	height: 100%;
	min-height: 60px;
	border: 2px dashed var(--border, #3a4a4a);
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: border-color 0.15s;
}
.pet-cut-dropzone:hover {
	border-color: var(--accent, #2a8a7a);
}

.pet-dropzone-label {
	color: var(--text-muted, #4a6060);
	font-size: 0.7em;
	text-align: center;
	line-height: 1.3;
	pointer-events: none;
}

/* Small "Browse" chip rendered when a MediaAdapter.onBrowseMedia
   callback is supplied. Positioned in the slot corner so it
   doesn't fight the click-to-upload dropzone beneath it. */
.pet-cut-browse {
	position: absolute;
	bottom: 2px;
	right: 2px;
	padding: 1px 6px;
	border: 1px solid var(--border, #3a4a4a);
	border-radius: 3px;
	background: var(--bg-secondary, #1a2a2a);
	color: var(--text-secondary, #8ca0a0);
	font-size: 0.65em;
	cursor: pointer;
	z-index: 2;
	line-height: 1.3;
}
.pet-cut-browse:hover {
	background: var(--bg-card, #2a3a3a);
	color: var(--text-primary, #d0dada);
}

.pet-cut-thumb {
	width: 100%;
	height: 100%;
	min-height: 60px;
	max-height: 80px;
	object-fit: cover;
	border-radius: 4px;
}

/* ── Content (prompt + duration) ────────────────────── */
.pet-cut-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.pet-cut-prompt {
	width: 100%;
	padding: 6px 8px;
	border: 1px solid var(--border, #2a3a3a);
	border-radius: 4px;
	background: var(--bg-primary, #0e1818);
	color: var(--text-primary, #d0dada);
	font-family: inherit;
	font-size: 0.85em;
	resize: vertical;
	min-height: 40px;
}
.pet-cut-prompt:focus {
	border-color: var(--accent, #2a8a7a);
	outline: none;
}
.pet-cut-prompt::placeholder {
	color: var(--text-muted, #4a5a5a);
}

.pet-cut-duration {
	display: flex;
	align-items: center;
	gap: 6px;
}

.pet-duration-value {
	color: var(--text-secondary, #8ca0a0);
	font-size: 0.85em;
	font-weight: bold;
	min-width: 30px;
	text-align: center;
}

.pet-btn-tiny {
	padding: 2px 6px;
	border: 1px solid var(--border, #3a4a4a);
	border-radius: 3px;
	background: var(--bg-secondary, #1a2a2a);
	color: var(--text-secondary, #8ca0a0);
	cursor: pointer;
	font-size: 0.75em;
	line-height: 1.2;
}
.pet-btn-tiny:hover {
	background: var(--bg-card, #2a3a3a);
}
.pet-btn-danger {
	color: var(--error, #c06060);
	border-color: var(--error-bg, #5a3030);
}
.pet-btn-danger:hover {
	background: var(--error-bg, #3a2020);
}

/* ── Action buttons ─────────────────────────────────── */
.pet-cut-actions {
	display: flex;
	flex-direction: column;
	gap: 4px;
	justify-content: center;
}

/* ── Duration strip ─────────────────────────────────── */
.pet-duration-strip {
	display: flex;
	height: 28px;
	margin-top: 12px;
	border-radius: 4px;
	overflow: hidden;
	border: 1px solid var(--border, #2a3a3a);
}

.pet-duration-block {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 20px;
	transition: width 0.2s;
}

.pet-duration-block-label {
	color: rgba(255,255,255,0.7);
	font-size: 0.7em;
	font-weight: bold;
	white-space: nowrap;
	overflow: hidden;
}
`;
