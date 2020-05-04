/** 
 * notochord-song by Jacob Bloom
 * This software is provided as-is, yadda yadda yadda
 */
import { Chord, Interval, Note } from '@tonaljs/tonal';

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

const SCALE_DEGREES = {
    '1P': { rootLetter: 'i', accidental: '' },
    '2m': { rootLetter: 'ii', accidental: 'b' },
    '2M': { rootLetter: 'ii', accidental: '' },
    '3m': { rootLetter: 'iii', accidental: 'b' },
    '3M': { rootLetter: 'iii', accidental: '' },
    '4P': { rootLetter: 'iv', accidental: '' },
    '4A': { rootLetter: 'v', accidental: 'b' },
    '5d': { rootLetter: 'v', accidental: 'b' },
    '5P': { rootLetter: 'v', accidental: '' },
    '6m': { rootLetter: 'vi', accidental: 'b' },
    '6M': { rootLetter: 'vi', accidental: '' },
    '7m': { rootLetter: 'vii', accidental: 'b' },
    '7M': { rootLetter: 'vii', accidental: '' }
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
        this._chord = this.getTransposedBy(rawChord, -1 * (this.song.get('transpose') || 0));
        this.emitChange(oldChord);
    }
    get chord() {
        return this.getTransposedBy(this._chord, this.song.get('transpose') || 0);
    }
    getScaleDegreeParts() {
        const chord = this._chord;
        if (!chord)
            return null;
        const [rootPart, quality] = Chord.tokenize(chord);
        // ignore transposition because it's relative to the 1
        const semis = Interval.distance(this.song.get('key'), rootPart);
        if (!semis)
            return null;
        const { quality: capsQuality } = Chord.get(chord);
        const minorish = capsQuality === 'Diminished' || capsQuality === 'Minor';
        const { rootLetter, accidental } = SCALE_DEGREES[semis];
        return {
            rootLetter: minorish ? rootLetter : rootLetter.toUpperCase(),
            accidental,
            quality,
        };
    }
    getChordParts() {
        const chord = this.chord;
        if (!chord)
            return null;
        const [rootPart, quality] = Chord.tokenize(chord);
        let accidental = '';
        if (rootPart[1] === 'b')
            accidental = 'b';
        if (rootPart[1] === '#')
            accidental = '#';
        return {
            rootLetter: rootPart[0],
            accidental,
            quality,
        };
    }
    changeBySemitones(semitones) {
        const oldChord = this._chord;
        this._chord = this.getTransposedBy(this._chord, semitones);
        this.emitChange(oldChord);
    }
    emitChange(oldChord) {
        this.song._emitChange('measures', {
            type: 'Beat.chord.set',
            beatObject: this,
            measureObject: this.measure,
            oldValue: oldChord,
            newValue: this._chord,
        });
    }
    getTransposedBy(chord, semitones) {
        if (!chord)
            return null;
        const chordEscaped = chord.replace(/-/g, 'm');
        const transposeInt = Interval.fromSemitones(semitones);
        const transposed = Chord.transpose(chordEscaped, transposeInt);
        const { tonic, aliases } = Chord.get(transposed);
        const shortestName = aliases ? aliases.reduce((l, r) => l.length <= r.length ? l : r) : '';
        if (tonic) {
            return Note.simplify(tonic) + shortestName.replace(/_/g, 'm7');
        }
        else {
            return null;
        }
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
        const [pc, quality] = Chord.tokenize(this.props.get('key'));
        const interval = Interval.fromSemitones(this.props.get('transpose'));
        return Note.transpose(pc, interval) + quality;
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

export { Beat, Measure, MeasureContainer, Song, SongIterator };
