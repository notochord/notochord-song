import Song from "./notochord-song";
import { Measure } from "./measure";
export default class SongIterator {
    song: Song;
    index: number;
    constructor(song: Song);
    /**
     * Get a measure by absolute index, without advancing the iterator.
     * @param {number} idx
     * @returns {Measure}
     */
    get(idx: number): Measure;
    /**
     * Get a measure relative to the current one, without advancing the iterator.
     * @param {number} [delta=0]
     * @returns {Measure}
     */
    getRelative(delta?: number): Measure;
    /**
     * Iterates over measures in playback order. See the Iterator Protocol.
     * @returns {{done: boolean, value: Measure|undefined}}
     */
    next(): IteratorResult<Measure | undefined>;
}
