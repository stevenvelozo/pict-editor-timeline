/**
 * CSS for the timeline editor — dark theme matching retold-labs.
 * Exported as a string; PictView injects it via the CSSMap.
 */
module.exports = `
/* ── Timeline container ─────────────────────────────── */
.pet-toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 0;
	border-bottom: 1px solid #2a3a3a;
	margin-bottom: 12px;
}

.pet-total-duration {
	flex: 1;
	text-align: right;
	color: #8ca0a0;
	font-size: 0.9em;
}

.pet-btn {
	padding: 6px 14px;
	border: 1px solid #3a4a4a;
	border-radius: 4px;
	background: #1a2a2a;
	color: #d0dada;
	cursor: pointer;
	font-size: 0.85em;
}
.pet-btn:hover {
	background: #2a3a3a;
}
.pet-btn-primary {
	background: #1a6a5a;
	border-color: #2a8a7a;
	color: #fff;
}
.pet-btn-primary:hover {
	background: #2a8a7a;
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
	color: #6a8080;
	font-size: 0.95em;
}

/* ── Cut card ───────────────────────────────────────── */
.pet-cut-card {
	display: flex;
	align-items: stretch;
	gap: 8px;
	padding: 8px;
	background: #162222;
	border: 1px solid #2a3a3a;
	border-radius: 6px;
	transition: opacity 0.15s, border-color 0.15s;
}
.pet-cut-card:hover {
	border-color: #3a5a5a;
}

.pet-dragging {
	opacity: 0.4;
}
.pet-drag-insert-before {
	border-top: 3px solid #2a8a7a !important;
}
.pet-drag-insert-after {
	border-bottom: 3px solid #2a8a7a !important;
}

/* Drag handle */
.pet-cut-handle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	min-height: 60px;
	cursor: grab;
	color: #4a6060;
	font-size: 14px;
	user-select: none;
}
.pet-cut-handle:hover {
	color: #8ca0a0;
}

/* Cut number badge */
.pet-cut-number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	color: #5a7070;
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
	border: 2px dashed #3a4a4a;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: border-color 0.15s;
}
.pet-cut-dropzone:hover {
	border-color: #2a8a7a;
}

.pet-dropzone-label {
	color: #4a6060;
	font-size: 0.7em;
	text-align: center;
	line-height: 1.3;
	pointer-events: none;
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
	border: 1px solid #2a3a3a;
	border-radius: 4px;
	background: #0e1818;
	color: #d0dada;
	font-family: inherit;
	font-size: 0.85em;
	resize: vertical;
	min-height: 40px;
}
.pet-cut-prompt:focus {
	border-color: #2a8a7a;
	outline: none;
}
.pet-cut-prompt::placeholder {
	color: #4a5a5a;
}

.pet-cut-duration {
	display: flex;
	align-items: center;
	gap: 6px;
}

.pet-duration-value {
	color: #8ca0a0;
	font-size: 0.85em;
	font-weight: bold;
	min-width: 30px;
	text-align: center;
}

.pet-btn-tiny {
	padding: 2px 6px;
	border: 1px solid #3a4a4a;
	border-radius: 3px;
	background: #1a2a2a;
	color: #8ca0a0;
	cursor: pointer;
	font-size: 0.75em;
	line-height: 1.2;
}
.pet-btn-tiny:hover {
	background: #2a3a3a;
}
.pet-btn-danger {
	color: #c06060;
	border-color: #5a3030;
}
.pet-btn-danger:hover {
	background: #3a2020;
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
	border: 1px solid #2a3a3a;
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
