import { Song } from "./song";
import { Measure } from "./measure";

export class SongIterator {
  public song: Song;
  public index = -1;

  public constructor(song: Song) {
    this.song = song;
  }
  /**
   * Get a measure by absolute index, without advancing the iterator.
   * @param {number} idx 
   * @returns {Measure}
   */
  public get(idx: number): Measure {
    return this.song.measures[idx];
  }
  /**
   * Get a measure relative to the current one, without advancing the iterator.
   * @param {number} [delta=0] 
   * @returns {Measure}
   */
  public getRelative(delta = 0): Measure {
    const idx = this.index + delta;
    return this.song.measures[idx];
  }
  /**
   * Iterates over measures in playback order. See the Iterator Protocol.
   * @returns {{done: boolean, value: Measure|undefined}}
   */
  public next(): IteratorResult<Measure | undefined> { // https://github.com/microsoft/TypeScript/issues/11375 fixed in July 2019 version of TS
    if(this.index < this.song.measures.length - 1) {
      this.index++;
      return {
        value: this.song.measures[this.index],
        done: false,
      };
    } else {
      this.index++;
      return {
        value: undefined,
        done: true,
      };
    }
  }
}