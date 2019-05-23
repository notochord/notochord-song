export default class SongIterator {
  constructor(song) {
    this.song = song;
    this.flattened = [...song.measureContainer]; // depends on the naive asumption that songs have finite length
    this.index = -1;
  }
  /**
   * Get a measure by absolute index
   * @param {number} idx 
   * @returns {Measure}
   */
  get(idx) {
    return this.flattened[idx];
  }
  /**
   * Get a measure relative to the current one, without advancing the iterator.
   * @param {number} [delta=0] 
   * @returns {Measure}
   */
  getRelative(delta = 0) {
    const idx = this.index + delta;
    return this.flattened[idx];
  }
  /**
   * iterates over measures in playback order. See the Iterator Protocol.
   */
  next() {
    this.index++;
    if(this.index < this.flattened.length) {
      return {value: this.flattened[this.index], done: false};
    } else {
      return {done: true};
    }
  }
}