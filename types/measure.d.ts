import { Beat } from './beat';
import { Song } from './song';
/**
 * Handles repeats and stuff
 */
export declare class MeasureContainer {
    type: 'repeat' | 'ending';
    measures: (Measure | MeasureContainer)[];
    repeatInfo: {
        repeatCount?: number;
        ending?: number;
    };
    private static DEFAULTS;
    constructor(song: Song, pseudoContainer?: SongDataMeasureContainer, fill?: boolean);
    serialize(): SongDataMeasureContainer;
    [Symbol.iterator](): Iterator<Measure>;
}
export declare class Measure {
    song: Song;
    index?: number;
    length: number;
    beats: Beat[];
    constructor(song: Song, pseudoMeasure: (string | null)[]);
    serialize(): (string | null)[];
}
