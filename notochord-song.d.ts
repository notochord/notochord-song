declare module "songiterator" {
    import Song from "song";
    export default class SongIterator {
        song: Song;
        index?: number;
        constructor(song: any);
        /**
         * Get a measure by absolute index, without advancing the iterator.
         * @param {number} idx
         * @returns {Measure}
         */
        get(idx: any): import("measure").Measure;
        /**
         * Get a measure relative to the current one, without advancing the iterator.
         * @param {number} [delta=0]
         * @returns {Measure}
         */
        getRelative(delta?: number): import("measure").Measure;
        /**
         * Iterates over measures in playback order. See the Iterator Protocol.
         * @returns {{done: boolean, value: Measure|undefined}}
         */
        next(): {
            value: import("measure").Measure;
            done: boolean;
        } | {
            done: boolean;
            value?: undefined;
        };
    }
}
declare module "beat" {
    import Song from "song";
    import { Measure } from "measure";
    export default class Beat {
        song: Song;
        measure: Measure;
        index?: number;
        private _chord;
        constructor(song: any, measure: any, index: any, pseudoBeat: any);
        /**
         *
         * @param {?string} rawChord
         */
        chord: any;
        scaleDegree: {
            numeral: any;
            flat: any;
            quality: any;
        };
        serialize(): any;
    }
}
declare module "measure" {
    import Beat from "beat";
    import Song from "song";
    /**
     * Handles repeats and stuff
     */
    export class MeasureContainer {
        type: 'repeat' | 'ending';
        measures: (Measure | MeasureContainer)[];
        repeatInfo: {
            repeatCount?: number;
            ending?: number;
        };
        private static DEFAULTS;
        constructor(song: any, pseudoContainer?: ISongDataMeasureContainer, fill?: boolean);
        serialize(): any;
        [Symbol.iterator](): Iterator<Measure>;
    }
    export class Measure {
        song: Song;
        index?: number;
        length: number;
        beats: Beat[];
        constructor(song: any, pseudoMeasure: any);
        serialize(): any[];
    }
}
declare module "song" {
    import SongIterator from "songiterator";
    import { Measure, MeasureContainer } from "measure";
    export default class Song {
        private props;
        private callbackMap;
        measureContainer: MeasureContainer;
        measures: Measure[];
        private static DEFAULTS;
        constructor(pseudoSong?: ISongData);
        /**
         * Get the transposed key of the song
         * @returns {string}
         */
        getTransposedKey(): any;
        /**
         * Subscribe to changes to a property of the song (except measureContainer)
         * @param {string} property Property to subscribe to changes to
         * @param {function} callback Function that is passed the new value when the property updates
         */
        onChange(property: any, callback: any): void;
        /**
         * Get a property of the song (except measureContainer)
         * @param {string} property
         * @returns {*} The value of that property (or undefined)
         */
        get(property: any): any;
        /**
         * Set a property of the song, and notify those subscribed to changes to that property.
         * @param {string} property
         * @param {*} value
         */
        set(property: any, value: any): void;
        /**
         * Generate default prop values. Can't just use a constant because the dates
         * change per runtime
         * @returns {Object}
         * @private
         */
        _makeDefaultProps(): {
            title: string;
            composedOn: number;
            composer: string;
            updatedOn: number;
            updatedBy: string;
            tempo: number;
            style: string;
            key: string;
            transpose: number;
            timeSignature: number[];
        };
        _emitChange(prop: any, value: any): void;
        serialize(): ISongData;
        [Symbol.iterator](): SongIterator;
    }
}
declare module "index" {
    export { default } from "song";
}
