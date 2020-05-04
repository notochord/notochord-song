const assert = require('assert').strict;
const { Song } = require('../dist/notochord-song.cjs');
const blueSkies = require('../blueSkies.cjs');

describe('Song', () => {
  describe('#getTransposedKey()', () => {
    it('returns key when transpose == 0', () => {
      const song = new Song(blueSkies);
      assert.equal(song.get('key'), song.getTransposedKey());
    });

    it('returns transposed key', () => {
      const song = new Song(blueSkies);
      song.set('transpose', 1);
      assert.equal(song.getTransposedKey(), 'Db');
    });
  });

  describe('#get()', () => {
    it('returns value for properties that exist', () => {
      const song = new Song(blueSkies);
      assert.equal(song.get('key'), 'C');
      assert.equal(song.get('transpose'), 0);
      assert.deepEqual(song.get('timeSignature'), [4, 4]);
    });
    it('returns undefined for properties that do not exist', () => {
      const song = new Song(blueSkies);
      assert.equal(song.get('foo'), undefined);
    });
  });

  describe('#set()', () => {
    it('should change the value returned by #get()', () => {
      const song = new Song(blueSkies);
      song.set('key', 'F');
      assert.equal(song.get('key'), 'F');
    });
    it('should call callbacks registered with #onChange() with matching property', () => {
      const song = new Song(blueSkies);
      let ran = false;
      const cb = value => {
        assert.equal(value, 'G');
        ran = true;
      };
      song.onChange('key', cb);
      song.set('key', 'G');
      assert(ran);
    });
    it('should not call callbacks registered with #onChange() with non-matching property', () => {
      const song = new Song(blueSkies);
      const cb = () => {
        throw new assert.AssertionError('this should not be called');
      };
      song.onChange('composer', cb);
      song.set('updatedOn', 12345);
    });
    it('should call callbacks registered with #onChange() without a property', () => {
      const song = new Song(blueSkies);
      let ran = false;
      const cb = (prop, value) => {
        assert.equal(prop, 'key');
        assert.equal(value, 'G');
        ran = true;
      };
      song.onChange(cb);
      song.set('key', 'G');
      assert(ran);
    });
  });

  describe('#onChange()', () => {
    it('should register a callback that runs on #set() with matching property', () => {
      const song = new Song(blueSkies);
      let ran = false;
      const cb = value => {
        assert.equal(value, 'G');
        ran = true;
      };
      song.onChange('key', cb);
      song.set('key', 'G');
      assert(ran);
    });
    it('property=="measures" registers a callback that runs on a chord change', () => {
      const song = new Song(blueSkies);
      let ran = false;
      const cb = value => {
        assert.equal(value.oldValue, 'Am');
        assert.equal(value.newValue, 'D7');
        ran = true;
      };
      song.onChange('measures', cb);
      song.measures[0].beats[0].chord = 'D7';
      assert(ran);
    });
    it('can be called without a property to subscribe to all changes', () => {
      const song = new Song(blueSkies);
      let ran = false;
      const cb = (prop, value) => {
        assert.equal(prop, 'key');
        assert.equal(value, 'G');
        ran = true;
      };
      song.onChange(cb);
      song.set('key', 'G');
      assert(ran);
    });
  });
  
  describe('#serialize()', () => {
    it('returns a similar value to the imported pseudosong', () => {
      const song = new Song(blueSkies);
      const origKeys = new Set(Object.keys(blueSkies));
      const serializedKeys = new Set(Object.keys(song.serialize()));
      // deepEqual on the serialized thing itself fails because of chord aliases
      assert.deepEqual(serializedKeys, origKeys);
    });
  });
});

describe('SongIterator', () => {
  describe('#get()', () => {
    it('returns same value as song.measures[idx]', () => {
      const song = new Song(blueSkies);
      const songIterator = song[Symbol.iterator]();
      assert.equal(songIterator.get(0), song.measures[0]);
    });
  });

  describe('#getRelative()', () => {
    it('returns value relative to iterator index', () => {
      const song = new Song(blueSkies);
      const songIterator = song[Symbol.iterator]();
      assert.equal(songIterator.index, -1);
      assert.equal(songIterator.getRelative(1), song.measures[0]);
      songIterator.next();
      assert.equal(songIterator.index, 0);
      assert.equal(songIterator.getRelative(1), song.measures[1]);
    });
  });

  describe('#next()', () => {
    it('iterates over song.measures following the Iterator Protocol', () => {
      const song = new Song(blueSkies);
      const songIterator = song[Symbol.iterator]();
      for(let i = 0; i < song.measures.length; i++) {
        const {done, value} = songIterator.next();
        assert.equal(value, song.measures[i]);
        assert.equal(done, false);
      }
      const {done, value} = songIterator.next();
      assert.equal(done, true);
      assert.equal(value, undefined);
    });
    it('Index is consistent with the previous .next value', () => {
      const song = new Song(blueSkies);
      const songIterator = song[Symbol.iterator]();
      assert.equal(songIterator.index, -1);
      for(let i = 0; i < song.measures.length; i++) {
        const {done, value} = songIterator.next();
        assert.equal(songIterator.index, i);
        assert.equal(done, false);
        assert.equal(value, song.measures[i]);
      }
      const {done, value} = songIterator.next();
      assert.equal(done, true);
      assert.equal(value, undefined);
    });
  });
});

describe('Measure', () => {
  describe('#index', () => {
    it('is the absolute index of the measure the first time it appears in song.measures', () => {
      const {measures} = new Song(blueSkies);
      const measure = measures[0];
      assert.equal(measure.index, measures.indexOf(measure));
    })
  });
});

describe('Beat', () => {
  describe('#index', () => {
    it('matches the beat\'s index in the measure, 0-indexed', () => {
      const beats = (new Song(blueSkies)).measures[0].beats;
      assert.equal(beats[0].index, 0);
      assert.equal(beats[1].index, 1);
      assert.equal(beats[2].index, 2);
      assert.equal(beats[3].index, 3);
    })
  });

  describe('#measure', () => {
    it('matches the beat\'s parent measure', () => {
      const measure = (new Song(blueSkies)).measures[0];
      const beat = measure.beats[0];
      assert.equal(beat.measure, measure);
    })
  });

  describe('#chord', () => {
    describe('get', () => {
      it('returns null if the beat is empty', () => {
        const beat = (new Song(blueSkies)).measures[0].beats[1];
        assert.strictEqual(beat.chord, null);
      });
      it('respects transpose', () => {
        const song = new Song(blueSkies);
        const beat = song.measures[0].beats[0];
        assert.equal(beat.chord, 'Am');
        song.set('transpose', 2);
        assert.equal(beat.chord, 'Bm');
      });
    });
    describe('set', () => {
      it('aliases chords', () => {
        const beat = (new Song(blueSkies)).measures[0].beats[0];
        beat.chord = 'C-';
        assert.equal(beat.chord, 'Cm');
        beat.chord = 'Caug7';
        assert.equal(beat.chord, 'C+7');
      });
      it('simplifies enharmonic chords', () => {
        const beat = (new Song(blueSkies)).measures[0].beats[0];
        beat.chord = 'C####';
        assert.equal(beat.chord, 'E');
      });
      it('respects transpose', () => {
        const song = new Song(blueSkies);
        const beat = song.measures[0].beats[0];
        song.set('transpose', 1);
        beat.chord = 'G#m';
        song.set('transpose', 0);
        assert.equal(beat.chord, 'Gm');
      });
      it('dispatches an onChange event', () => {
        const song = new Song(blueSkies);
        const beat = song.measures[0].beats[0];
        let ran = false;
        const cb = value => {
          assert.equal(value.oldValue, 'Am');
          assert.equal(value.newValue, 'Abm');
          ran = true;
        };
        song.onChange('measures', cb);
        beat.chord = 'Abm';
        assert(ran);
      });
    });
  });

  describe('#getScaleDegreeParts()', () => {
    it('ignores transpose', () => {
      const song = new Song(blueSkies);
      const beat = song.measures[0].beats[0];
      const expected = {
        accidental: '',
        rootLetter: 'vi',
        quality: 'm'
      }
      assert.deepEqual(beat.getScaleDegreeParts(), expected);
      song.set('transpose', 1);
      assert.deepEqual(beat.getScaleDegreeParts(), expected);
    });
    it('capitalizes based on quality of chord', () => {
      const beat = (new Song(blueSkies)).measures[0].beats[0];
      beat.chord = 'C';
      assert.equal(beat.getScaleDegreeParts().rootLetter, 'I');
      beat.chord = 'C-';
      assert.equal(beat.getScaleDegreeParts().rootLetter, 'i');
      beat.chord = 'C+';
      assert.equal(beat.getScaleDegreeParts().rootLetter, 'I');
      beat.chord = 'Co';
      assert.equal(beat.getScaleDegreeParts().rootLetter, 'i');
    });
    it('includes quality of chord', () => {
      const beat = (new Song(blueSkies)).measures[0].beats[0];
      const expected = {
        accidental: '',
        rootLetter: 'vi',
        quality: 'm'
      }
      assert.deepEqual(beat.getScaleDegreeParts(), expected);
    });
    it('returns null if the beat is empty', () => {
      const beat = (new Song(blueSkies)).measures[0].beats[1];
      assert.strictEqual(beat.getScaleDegreeParts(), null);
    });
  });

  describe('#getChordParts()', () => {
    it('respects transpose', () => {
      const song = new Song(blueSkies);
      const beat = song.measures[0].beats[0];
      assert.deepEqual(beat.getChordParts(), {
        accidental: '',
        rootLetter: 'A',
        quality: 'm'
      });
      song.set('transpose', 1);
      assert.deepEqual(beat.getChordParts(), {
        accidental: 'b',
        rootLetter: 'B',
        quality: 'm'
      });
    });
    it('returns null if the beat is empty', () => {
      const beat = (new Song(blueSkies)).measures[0].beats[1];
      assert.strictEqual(beat.getChordParts(), null);
    });
  });

  describe('#changeBySemitones()', () => {
    it('changes beat by semitones', () => {
      const song = new Song(blueSkies);
      const beat = song.measures[0].beats[0];
      beat.changeBySemitones(1);
      assert.equal(beat.chord, 'Bbm');
    });
    it('does not result in extra accidentals', () => {
      const song = new Song(blueSkies);
      const beat = song.measures[0].beats[0];
      beat.changeBySemitones(1);
      assert.equal(beat.chord, 'Bbm');
      beat.changeBySemitones(1);
      assert.equal(beat.chord, 'Bm');
      beat.changeBySemitones(1);
      assert.equal(beat.chord, 'Cm');
    });
    it('not affected by transpose', () => {
      const song = new Song(blueSkies);
      const beat = song.measures[0].beats[0];
      song.set('transpose', 1);
      assert.equal(beat.chord, 'Bbm');
      beat.changeBySemitones(1);
      assert.equal(beat.chord, 'Bm');
    });
  });
});