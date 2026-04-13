/**
 * pict-editor-timeline — Main Export
 *
 * Visual timeline editor for building multi-beat video storyboards.
 * Exports the PictView-Timeline view class as the default export,
 * plus individual provider classes for advanced usage.
 *
 * Usage:
 *   const libTimeline = require('pict-editor-timeline');
 *   pict.addView('MyTimeline', libTimeline.default_configuration, libTimeline);
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */

const libPictViewTimeline = require('./views/PictView-Timeline.js');

// Default export: the main view class
module.exports = libPictViewTimeline;

// Re-export configuration and provider classes for advanced usage
module.exports.default_configuration = libPictViewTimeline.default_configuration;
module.exports.TimelineOpsProvider = require('./providers/Pict-Provider-TimelineOps.js');
module.exports.TimelineDragDropProvider = require('./providers/Pict-Provider-TimelineDragDrop.js');
