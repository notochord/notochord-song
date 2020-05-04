import { Song } from './song';
import { Measure } from './measure';
export declare class Beat {
    song: Song;
    measure: Measure;
    index?: number;
    private _chord;
    constructor(song: Song, measure: Measure, index: number, pseudoBeat: string | null);
    /**
     *
     * @param {?string} rawChord
     */
    chord: string | null;
    getScaleDegreeParts(): ChordParts | null;
    getChordParts(): ChordParts | null;
    changeBySemitones(semitones: number): void;
    private emitChange;
    private getTransposedBy;
    serialize(): string | null;
}
