import Song from './notochord-song';
import { Measure } from './measure';
export default class Beat {
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
    scaleDegree: ScaleDegree | null;
    serialize(): string | null;
}
