/** 
 * notochord-song by Jacob Bloom
 * This software is provided as-is, yadda yadda yadda
 */
import * as _Tonal from 'https://dev.jspm.io/tonal@2.2.2';
import _Tonal__default, {  } from 'https://dev.jspm.io/tonal@2.2.2';

class SongIterator {
    constructor(song) {
        this.index = -1;
        this.song = song;
    }
    /**
     * Get a measure by absolute index, without advancing the iterator.
     * @param {number} idx
     * @returns {Measure}
     */
    get(idx) {
        return this.song.measures[idx];
    }
    /**
     * Get a measure relative to the current one, without advancing the iterator.
     * @param {number} [delta=0]
     * @returns {Measure}
     */
    getRelative(delta = 0) {
        const idx = this.index + delta;
        return this.song.measures[idx];
    }
    /**
     * Iterates over measures in playback order. See the Iterator Protocol.
     * @returns {{done: boolean, value: Measure|undefined}}
     */
    next() {
        if (this.index < this.song.measures.length - 1) {
            this.index++;
            return {
                value: this.song.measures[this.index],
                done: false,
            };
        }
        else {
            this.index++;
            return {
                value: undefined,
                done: true,
            };
        }
    }
}

const Tonal = _Tonal__default || _Tonal;
const SCALE_DEGREES = {
    1: { numeral: 'i', flat: false },
    2: { numeral: 'ii', flat: true },
    3: { numeral: 'ii', flat: false },
    4: { numeral: 'iii', flat: true },
    5: { numeral: 'iii', flat: false },
    6: { numeral: 'iv', flat: false },
    7: { numeral: 'v', flat: true },
    8: { numeral: 'v', flat: false },
    9: { numeral: 'vi', flat: true },
    10: { numeral: 'vi', flat: false },
    11: { numeral: 'vii', flat: true },
    12: { numeral: 'vii', flat: false }
};
class Beat {
    constructor(song, measure, index, pseudoBeat) {
        this.song = song;
        this.measure = measure;
        this.index = index;
        this.chord = pseudoBeat;
    }
    /**
     *
     * @param {?string} rawChord
     */
    set chord(rawChord) {
        const oldChord = this._chord;
        this._chord = null;
        if (rawChord) {
            let parsed = rawChord.replace(/-/g, 'm');
            const chordParts = Tonal.Chord.tokenize(parsed);
            if (this.song.get('transpose') && chordParts[0]) {
                const transposeInt = Tonal.Interval.fromSemitones(this.song.get('transpose'));
                chordParts[0] = Tonal.Note.enharmonic(Tonal.transpose(chordParts[0], Tonal.Interval.invert(transposeInt)));
            }
            // get the shortest chord name
            if (chordParts[1]) {
                const names = Tonal.Chord.props(chordParts[1]).names;
                if (names && names.length) {
                    chordParts[1] = names
                        .reduce((l, r) => l.length <= r.length ? l : r)
                        .replace(/_/g, 'm7');
                }
                else {
                    chordParts[1] = '';
                }
            }
            parsed = chordParts.join('');
            this._chord = parsed;
        }
        this.song._emitChange('measures', {
            type: 'Beat.chord.set',
            beatObject: this,
            measureObject: this.measure,
            oldValue: oldChord,
            newValue: this._chord,
        });
    }
    get chord() {
        const transpose = this.song.get('transpose');
        const chord = this._chord;
        if (chord) {
            if (transpose) {
                const transposeInt = Tonal.Interval.fromSemitones(transpose);
                const chordParts = Tonal.Chord.tokenize(chord);
                chordParts[0] = Tonal.Note.enharmonic(Tonal.transpose(chordParts[0], transposeInt));
                return chordParts.join('');
            }
            else {
                return chord;
            }
        }
        else {
            return null;
        }
    }
    get scaleDegree() {
        const chord = this._chord;
        if (!chord)
            return null;
        const chordParts = Tonal.Chord.tokenize(chord);
        // ignore transposition because it's relative to the 1
        const semis = Tonal.Distance.semitones(this.song.get('key'), chordParts[0]) + 1;
        const minorish = chordParts[1][0] === 'm' || chordParts[1][0] === 'o';
        const SD = SCALE_DEGREES[semis];
        return {
            numeral: minorish ? SD.numeral : SD.numeral.toUpperCase(),
            flat: SD.flat,
            quality: chordParts[1]
        };
    }
    set scaleDegree(rawScaleDegree) {
        throw new Error('scaleDegree must not be set');
    }
    serialize() {
        return this.chord;
    }
}

function isMeasureContainer(value) {
    return !!value.type;
}
/**
 * Handles repeats and stuff
 */
class MeasureContainer {
    constructor(song, pseudoContainer = MeasureContainer.DEFAULTS, fill = false) {
        this.type = pseudoContainer.type || 'repeat';
        if (fill) {
            const songLength = 8;
            const measureLength = Number(song.get('timeSignature')[0]);
            const pseudoMeasure = (new Array(measureLength)).fill(null);
            this.measures = [];
            for (let i = 0; i < songLength; i++) {
                this.measures.push(new Measure(song, pseudoMeasure));
            }
        }
        else {
            this.measures = [];
            for (const pseudoMeasure of pseudoContainer.measures) {
                if (isMeasureContainer(pseudoMeasure)) {
                    this.measures.push(new MeasureContainer(song, pseudoMeasure));
                }
                else {
                    this.measures.push(new Measure(song, pseudoMeasure));
                }
            }
        }
        this.repeatInfo = Object.assign({}, pseudoContainer.repeatInfo);
    }
    serialize() {
        return {
            type: this.type,
            measures: this.measures.map(measure => measure.serialize()),
            repeatInfo: this.repeatInfo
        };
    }
    *[Symbol.iterator]() {
        const repeatCount = this.type === 'repeat' ? this.repeatInfo.repeatCount : 1;
        for (let repeat = 1; repeat <= repeatCount; repeat++) {
            m: for (const measure of this.measures) {
                if (measure instanceof MeasureContainer) {
                    if (measure.type === 'repeat') {
                        yield* measure;
                    }
                    else if (measure.type === 'ending') {
                        if (measure.repeatInfo.ending === repeat) {
                            yield* measure;
                        }
                        else {
                            continue m;
                        }
                    }
                }
                else {
                    yield measure;
                }
            }
        }
    }
}
MeasureContainer.DEFAULTS = {
    measures: [],
    repeatInfo: {},
    type: 'repeat',
};
class Measure {
    constructor(song, pseudoMeasure) {
        this.song = song;
        this.length = song.get('timeSignature')[0];
        this.beats = pseudoMeasure.map((pseudoBeat, index) => new Beat(this.song, this, index, pseudoBeat));
    }
    serialize() {
        return this.beats.map(beat => beat.serialize());
        // @todo props like repeats and stuff
    }
}

const Tonal$1 = _Tonal__default || _Tonal;
class Song {
    constructor(pseudoSong = Song.DEFAULTS) {
        this.anyCallbacks = [];
        this.props = new Map(Object.entries(Object.assign({}, this._makeDefaultProps(), pseudoSong, { measureContainer: undefined })));
        this.callbackMap = new Map();
        this.measureContainer = new MeasureContainer(this, pseudoSong.measureContainer || undefined, !pseudoSong.measureContainer);
        this.measures = [...this.measureContainer]; // depends on the naive asumption that songs have finite length
        this.measures.forEach((measure, index) => {
            if (measure.index === undefined) {
                measure.index = index;
            }
        });
    }
    /**
     * Get the transposed key of the song
     * @returns {string}
     */
    getTransposedKey() {
        const [pc, quality] = Tonal$1.Chord.tokenize(this.props.get('key'));
        const interval = Tonal$1.Interval.fromSemitones(this.props.get('transpose'));
        return Tonal$1.transpose(pc, interval) + quality;
    }
    onChange(propertyOrCallback, callback) {
        if (typeof propertyOrCallback === 'string') {
            if (!this.callbackMap.has(propertyOrCallback))
                this.callbackMap.set(propertyOrCallback, new Set());
            this.callbackMap.get(propertyOrCallback).add(callback);
        }
        else {
            this.anyCallbacks.push(propertyOrCallback);
        }
    }
    /**
     * Get a property of the song (except measureContainer, use "measures" for measures)
     * @param {string} property
     * @returns {*} The value of that property (or undefined)
     */
    get(property) {
        return this.props.get(property);
    }
    /**
     * Set a property of the song, and notify those subscribed to changes to that property.
     * @param {string} property
     * @param {*} value
     */
    set(property, value) {
        this.props.set(property, value);
        this._emitChange(property, value);
    }
    /**
     * Generate default prop values. Can't just use a constant because the dates
     * change per runtime
     * @returns {Object}
     * @private
     */
    _makeDefaultProps() {
        return {
            title: 'New Song',
            composedOn: Date.now(),
            composer: '',
            updatedOn: Date.now(),
            updatedBy: '',
            tempo: 160,
            style: 'swing',
            key: 'C',
            transpose: 0,
            timeSignature: [4, 4]
        };
    }
    _emitChange(prop, value) {
        const cbs = this.callbackMap.get(prop);
        if (cbs) {
            for (const cb of cbs)
                cb(value);
        }
        for (const cb of this.anyCallbacks)
            cb(prop, value);
    }
    serialize() {
        // aww Object.fromEntries isn't ready yet :(
        const out = { measureContainer: null };
        for (const [key, val] of this.props) {
            out[key] = val;
        }
        out.measureContainer = this.measureContainer.serialize();
        return out;
    }
    [Symbol.iterator]() {
        return new SongIterator(this);
    }
}
Song.DEFAULTS = {
    title: '',
    tempo: 120,
    key: 'C',
    transpose: 0,
    timeSignature: [4, 4],
    measureContainer: null,
};

export default Song;
