import SongIterator from './songiterator.js';
import { Measure, MeasureContainer } from './measure';
export default class Song {
    private props;
    private callbackMap;
    measureContainer: MeasureContainer;
    measures: Measure[];
    private static DEFAULTS;
    constructor(pseudoSong?: SongData);
    /**
     * Get the transposed key of the song
     * @returns {string}
     */
    getTransposedKey(): string;
    /**
     * Subscribe to changes to a property of the song (except measureContainer)
     * @param {string} property Property to subscribe to changes to
     * @param {function} callback Function that is passed the new value when the property updates
     */
    onChange(property: string, callback: (newValue: any) => void): void;
    /**
     * Get a property of the song (except measureContainer)
     * @param {string} property
     * @returns {*} The value of that property (or undefined)
     */
    get(property: string): any;
    /**
     * Set a property of the song, and notify those subscribed to changes to that property.
     * @param {string} property
     * @param {*} value
     */
    set(property: string, value: any): void;
    /**
     * Generate default prop values. Can't just use a constant because the dates
     * change per runtime
     * @returns {Object}
     * @private
     */
    private _makeDefaultProps;
    _emitChange(prop: string, value: any): void;
    serialize(): SongData;
    [Symbol.iterator](): SongIterator;
}
