/**
 * pict-editor-timeline — Unit Tests
 *
 * Tests the data model (TimelineOps provider) independently of any
 * DOM rendering. Covers cut CRUD, reorder, export/import round-trip,
 * and duration math.
 */
const libAssert = require('assert');
const libFable = require('fable');

const libPictEditorTimeline = require('../source/Pict-Section-Timeline.js');
const libTimelineOps = require('../source/providers/Pict-Provider-TimelineOps.js');

suite
(
	'pict-editor-timeline',
	() =>
	{
		/**
		 * Helper: create a fresh TimelineOps provider. Each provider
		 * instance owns its own cuts array (this._Cuts), so no
		 * AppData mock is required — the provider only touches
		 * this.log and its own instance state.
		 */
		function createOps(pServiceHash)
		{
			let tmpFable = new libFable(
				{
					Product: 'TimelineTest',
					LogStreams: [{ streamtype: 'console', level: 'fatal' }]
				});

			// Minimal mock of the pict surface (log is still read in
			// the import/export error paths)
			let tmpMockPict =
			{
				AppData: {},
				log: tmpFable.log
			};

			// Construct the provider directly (it extends fable-serviceproviderbase)
			let tmpOps = new libTimelineOps(tmpFable, {}, pServiceHash || 'TestTimelineOps');
			tmpOps.pict = tmpMockPict;
			tmpOps.log = tmpFable.log;
			tmpOps._ParentTimeline =
			{
				options:
				{
					DefaultCut:
					{
						prompt: '',
						target_seconds: 2,
						start_image: '',
						end_image: ''
					}
				}
			};

			return tmpOps;
		}

		// ============================================================
		// Module export structure
		// ============================================================
		suite
		(
			'Module exports',
			() =>
			{
				test
				(
					'should export the main view class as default',
					(fDone) =>
					{
						libAssert.strictEqual(typeof libPictEditorTimeline, 'function');
						libAssert.ok(libPictEditorTimeline.default_configuration);
						libAssert.strictEqual(libPictEditorTimeline.default_configuration.ViewIdentifier, 'Pict-Editor-Timeline');
						fDone();
					}
				);

				test
				(
					'should export provider classes',
					(fDone) =>
					{
						libAssert.strictEqual(typeof libPictEditorTimeline.TimelineOpsProvider, 'function');
						libAssert.strictEqual(typeof libPictEditorTimeline.TimelineDragDropProvider, 'function');
						fDone();
					}
				);

				test
				(
					'default_configuration should have expected fields',
					(fDone) =>
					{
						let tmpConfig = libPictEditorTimeline.default_configuration;
						libAssert.strictEqual(tmpConfig.DefaultDestinationAddress, '#PictEditorTimeline');
						libAssert.strictEqual(tmpConfig.MaxCuts, 50);
						libAssert.strictEqual(tmpConfig.FPS, 16);
						libAssert.ok(tmpConfig.CSS.length > 100, 'CSS should be non-trivial');
						fDone();
					}
				);
			}
		);

		// ============================================================
		// Cut CRUD
		// ============================================================
		suite
		(
			'Cut CRUD',
			() =>
			{
				test
				(
					'addCut should append a cut with defaults',
					(fDone) =>
					{
						let tmpOps = createOps();
						libAssert.strictEqual(tmpOps.getCutCount(), 0);

						tmpOps.addCut(-1);
						libAssert.strictEqual(tmpOps.getCutCount(), 1);

						let tmpCut = tmpOps.getCuts()[0];
						libAssert.strictEqual(tmpCut.prompt, '');
						libAssert.strictEqual(tmpCut.target_seconds, 2);
						libAssert.ok(tmpCut.id.startsWith('cut-'));
						fDone();
					}
				);

				test
				(
					'addCut should insert after a specific index',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'prompt', 'first');
						tmpOps.addCut(-1);
						tmpOps.updateCut(1, 'prompt', 'second');

						// Insert after index 0
						tmpOps.addCut(0);
						tmpOps.updateCut(1, 'prompt', 'middle');

						libAssert.strictEqual(tmpOps.getCutCount(), 3);
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'first');
						libAssert.strictEqual(tmpOps.getCuts()[1].prompt, 'middle');
						libAssert.strictEqual(tmpOps.getCuts()[2].prompt, 'second');
						fDone();
					}
				);

				test
				(
					'removeCut should remove at index and return it',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'prompt', 'keep');
						tmpOps.addCut(-1);
						tmpOps.updateCut(1, 'prompt', 'remove me');
						tmpOps.addCut(-1);
						tmpOps.updateCut(2, 'prompt', 'also keep');

						let tmpRemoved = tmpOps.removeCut(1);
						libAssert.strictEqual(tmpRemoved.prompt, 'remove me');
						libAssert.strictEqual(tmpOps.getCutCount(), 2);
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'keep');
						libAssert.strictEqual(tmpOps.getCuts()[1].prompt, 'also keep');
						fDone();
					}
				);

				test
				(
					'removeCut should return null for out-of-range index',
					(fDone) =>
					{
						let tmpOps = createOps();
						libAssert.strictEqual(tmpOps.removeCut(0), null);
						libAssert.strictEqual(tmpOps.removeCut(-1), null);
						fDone();
					}
				);

				test
				(
					'duplicateCut should deep-copy and insert after',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'prompt', 'original');
						tmpOps.updateCut(0, 'target_seconds', 5);
						tmpOps.updateCut(0, 'start_image', 'img.jpg');

						let tmpDup = tmpOps.duplicateCut(0);
						libAssert.strictEqual(tmpOps.getCutCount(), 2);
						libAssert.strictEqual(tmpDup.prompt, 'original');
						libAssert.strictEqual(tmpDup.target_seconds, 5);
						libAssert.strictEqual(tmpDup.start_image, 'img.jpg');

						// Should have a different ID
						libAssert.notStrictEqual(tmpDup.id, tmpOps.getCuts()[0].id);

						// Mutating the duplicate should not affect the original
						tmpDup.prompt = 'changed';
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'original');
						fDone();
					}
				);

				test
				(
					'updateCut should set a single field',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'prompt', 'hello');
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'hello');
						tmpOps.updateCut(0, 'target_seconds', 7.5);
						libAssert.strictEqual(tmpOps.getCuts()[0].target_seconds, 7.5);
						fDone();
					}
				);
			}
		);

		// ============================================================
		// Reorder
		// ============================================================
		suite
		(
			'Reorder',
			() =>
			{
				test
				(
					'moveCut should move forward',
					(fDone) =>
					{
						let tmpOps = createOps();
						for (let i = 0; i < 4; i++)
						{
							tmpOps.addCut(-1);
							tmpOps.updateCut(i, 'prompt', 'cut-' + i);
						}

						tmpOps.moveCut(0, 2);
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'cut-1');
						libAssert.strictEqual(tmpOps.getCuts()[1].prompt, 'cut-2');
						libAssert.strictEqual(tmpOps.getCuts()[2].prompt, 'cut-0');
						libAssert.strictEqual(tmpOps.getCuts()[3].prompt, 'cut-3');
						fDone();
					}
				);

				test
				(
					'moveCut should move backward',
					(fDone) =>
					{
						let tmpOps = createOps();
						for (let i = 0; i < 4; i++)
						{
							tmpOps.addCut(-1);
							tmpOps.updateCut(i, 'prompt', 'cut-' + i);
						}

						tmpOps.moveCut(3, 1);
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'cut-0');
						libAssert.strictEqual(tmpOps.getCuts()[1].prompt, 'cut-3');
						libAssert.strictEqual(tmpOps.getCuts()[2].prompt, 'cut-1');
						libAssert.strictEqual(tmpOps.getCuts()[3].prompt, 'cut-2');
						fDone();
					}
				);

				test
				(
					'moveCut to same index should be a no-op',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'prompt', 'only');
						tmpOps.moveCut(0, 0);
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'only');
						fDone();
					}
				);
			}
		);

		// ============================================================
		// Duration math
		// ============================================================
		suite
		(
			'Duration math',
			() =>
			{
				test
				(
					'getTotalSeconds should sum all cuts',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'target_seconds', 2);
						tmpOps.addCut(-1);
						tmpOps.updateCut(1, 'target_seconds', 3.5);
						tmpOps.addCut(-1);
						tmpOps.updateCut(2, 'target_seconds', 1);

						libAssert.strictEqual(tmpOps.getTotalSeconds(), 6.5);
						fDone();
					}
				);

				test
				(
					'getTotalSeconds should return 0 for empty timeline',
					(fDone) =>
					{
						let tmpOps = createOps();
						libAssert.strictEqual(tmpOps.getTotalSeconds(), 0);
						fDone();
					}
				);

				test
				(
					'getTotalSeconds should handle non-numeric gracefully',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'target_seconds', 'not-a-number');
						libAssert.strictEqual(tmpOps.getTotalSeconds(), 0);
						fDone();
					}
				);
			}
		);

		// ============================================================
		// Export / Import round-trip
		// ============================================================
		suite
		(
			'Export / Import',
			() =>
			{
				test
				(
					'getStoryboard should produce clean JSON without internal fields',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'prompt', 'Walk through garden');
						tmpOps.updateCut(0, 'target_seconds', 3);
						tmpOps.updateCut(0, 'start_image', '/img/garden.jpg');
						tmpOps.updateCut(0, 'end_image', '/img/flower.jpg');

						let tmpBeats = tmpOps.getStoryboard();
						libAssert.strictEqual(tmpBeats.length, 1);
						libAssert.strictEqual(tmpBeats[0].prompt, 'Walk through garden');
						libAssert.strictEqual(tmpBeats[0].target_seconds, 3);
						libAssert.strictEqual(tmpBeats[0].beat_image, '/img/garden.jpg');
						libAssert.strictEqual(tmpBeats[0].end_image, '/img/flower.jpg');

						// No internal fields
						libAssert.strictEqual(tmpBeats[0].id, undefined);
						libAssert.strictEqual(tmpBeats[0]._collapsed, undefined);
						libAssert.strictEqual(tmpBeats[0]._dragOver, undefined);
						libAssert.strictEqual(tmpBeats[0].start_image, undefined);
						fDone();
					}
				);

				test
				(
					'getStoryboard should omit empty optional fields',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'prompt', 'Just text');
						tmpOps.updateCut(0, 'target_seconds', 2);

						let tmpBeats = tmpOps.getStoryboard();
						libAssert.strictEqual(tmpBeats[0].beat_image, undefined);
						libAssert.strictEqual(tmpBeats[0].end_image, undefined);
						fDone();
					}
				);

				test
				(
					'loadStoryboard should populate cuts from JSON array',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.loadStoryboard([
							{ prompt: 'beat one', target_seconds: 3, beat_image: '/img/a.jpg' },
							{ prompt: 'beat two', target_seconds: 2 },
							{ prompt: 'beat three', target_seconds: 4, end_image: '/img/end.jpg' }
						]);

						libAssert.strictEqual(tmpOps.getCutCount(), 3);
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'beat one');
						libAssert.strictEqual(tmpOps.getCuts()[0].target_seconds, 3);
						libAssert.strictEqual(tmpOps.getCuts()[0].start_image, '/img/a.jpg');
						libAssert.strictEqual(tmpOps.getCuts()[1].prompt, 'beat two');
						libAssert.strictEqual(tmpOps.getCuts()[1].start_image, '');
						libAssert.strictEqual(tmpOps.getCuts()[2].end_image, '/img/end.jpg');
						fDone();
					}
				);

				test
				(
					'loadStoryboard should accept a JSON string',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.loadStoryboard('[{"prompt":"from string","target_seconds":1.5}]');
						libAssert.strictEqual(tmpOps.getCutCount(), 1);
						libAssert.strictEqual(tmpOps.getCuts()[0].prompt, 'from string');
						libAssert.strictEqual(tmpOps.getCuts()[0].target_seconds, 1.5);
						fDone();
					}
				);

				test
				(
					'loadStoryboard should convert extend_frames to target_seconds',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.loadStoryboard([
							{ prompt: 'frames-based', extend_frames: 48 }
						]);
						// 48 / 16 = 3.0 seconds
						libAssert.strictEqual(tmpOps.getCuts()[0].target_seconds, 3);
						fDone();
					}
				);

				test
				(
					'export → import → export round-trip should produce identical JSON',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						tmpOps.updateCut(0, 'prompt', 'Garden walk');
						tmpOps.updateCut(0, 'target_seconds', 3);
						tmpOps.updateCut(0, 'start_image', '/img/garden.jpg');
						tmpOps.addCut(-1);
						tmpOps.updateCut(1, 'prompt', 'Pick flower');
						tmpOps.updateCut(1, 'target_seconds', 2);

						let tmpExport1 = tmpOps.getStoryboardJSON();

						// Import into a fresh ops instance
						let tmpOps2 = createOps();
						tmpOps2.loadStoryboard(tmpExport1);
						let tmpExport2 = tmpOps2.getStoryboardJSON();

						libAssert.strictEqual(tmpExport1, tmpExport2);
						fDone();
					}
				);
			}
		);

		// ============================================================
		// Unique IDs
		// ============================================================
		suite
		(
			'Unique IDs',
			() =>
			{
				test
				(
					'each cut should have a unique ID',
					(fDone) =>
					{
						let tmpOps = createOps();
						for (let i = 0; i < 10; i++)
						{
							tmpOps.addCut(-1);
						}

						let tmpIds = tmpOps.getCuts().map((c) => c.id);
						let tmpUnique = new Set(tmpIds);
						libAssert.strictEqual(tmpUnique.size, 10, 'All 10 IDs should be unique');
						fDone();
					}
				);

				test
				(
					'duplicated cut should have a different ID from source',
					(fDone) =>
					{
						let tmpOps = createOps();
						tmpOps.addCut(-1);
						let tmpOriginalId = tmpOps.getCuts()[0].id;
						tmpOps.duplicateCut(0);
						let tmpDupId = tmpOps.getCuts()[1].id;
						libAssert.notStrictEqual(tmpOriginalId, tmpDupId);
						fDone();
					}
				);
			}
		);

		// ============================================================
		// Multi-instance isolation
		// ============================================================
		suite
		(
			'Multi-instance isolation',
			() =>
			{
				test
				(
					'two provider instances should not share cuts',
					(fDone) =>
					{
						let tmpOpsA = createOps('TimelineOpsA');
						let tmpOpsB = createOps('TimelineOpsB');

						tmpOpsA.addCut(-1);
						tmpOpsA.updateCut(0, 'prompt', 'A-only');

						// Instance B must start empty and stay empty
						libAssert.strictEqual(tmpOpsB.getCutCount(), 0, 'B should not see A\'s cut');

						tmpOpsB.addCut(-1);
						tmpOpsB.updateCut(0, 'prompt', 'B-only');

						// After B adds its own cut, A should still have exactly one
						libAssert.strictEqual(tmpOpsA.getCutCount(), 1);
						libAssert.strictEqual(tmpOpsA.getCuts()[0].prompt, 'A-only');
						libAssert.strictEqual(tmpOpsB.getCutCount(), 1);
						libAssert.strictEqual(tmpOpsB.getCuts()[0].prompt, 'B-only');
						fDone();
					}
				);

				test
				(
					'loadStoryboard on one instance must not affect another',
					(fDone) =>
					{
						let tmpOpsA = createOps('TimelineOpsA');
						let tmpOpsB = createOps('TimelineOpsB');

						tmpOpsA.loadStoryboard([
							{ prompt: 'a1', target_seconds: 1 },
							{ prompt: 'a2', target_seconds: 2 }
						]);
						tmpOpsB.loadStoryboard([
							{ prompt: 'b1', target_seconds: 3 }
						]);

						libAssert.strictEqual(tmpOpsA.getCutCount(), 2);
						libAssert.strictEqual(tmpOpsA.getCuts()[0].prompt, 'a1');
						libAssert.strictEqual(tmpOpsA.getCuts()[1].prompt, 'a2');

						libAssert.strictEqual(tmpOpsB.getCutCount(), 1);
						libAssert.strictEqual(tmpOpsB.getCuts()[0].prompt, 'b1');
						fDone();
					}
				);

				test
				(
					'polling-style repeated addCut should not accumulate across instances',
					(fDone) =>
					{
						// Simulates the retold-labs bug: each "poll" spins
						// up a new TimelineOps and seeds it with one empty
						// cut. Previously this bled cuts into a shared
						// AppData array; now each instance must stay at 1.
						let tmpInstances = [];
						for (let i = 0; i < 10; i++)
						{
							let tmpOps = createOps('PollOps-' + i);
							tmpOps.addCut(-1);
							tmpInstances.push(tmpOps);
						}
						for (let i = 0; i < tmpInstances.length; i++)
						{
							libAssert.strictEqual(
								tmpInstances[i].getCutCount(),
								1,
								'instance ' + i + ' should have exactly one cut');
						}
						fDone();
					}
				);
			}
		);
	}
);
