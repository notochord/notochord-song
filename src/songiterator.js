export default class SongIterator {
  constructor(song) {
    this.song = song;
    this.cache = [];
    this.indexInCache = -1;
    this.iterator = this.song.measureContainer[Symbol.iterator]();
  }
  /**
   * Get a measure relative to the current one, without advancing the iterator.
   * @param {number} [delta=0] 
   * @returns {Measure}
   */
  getRelative(delta = 0) {
    const idx = this.indexInCache + delta;
    while(idx >= this.cache.length) {
      const {value, done} = this.iterator.next();
      this.cache.push(value);
      if(!done) break;
    }
    return this.cache[idx];
  }
  /**
   * iterates over measures in playback order. See the Iterator Protocol.
   */
  next() {
    this.indexInCache++;
    if(this.indexInCache < this.cache.length) {
      return {done: false, value: this.cache[this.indexInCache]};
    } else {
      const {value, done} = this.iterator.next();
      if(done) {
        return {done: true}
      } else {
        this.cache.push(value);
        return {value, done: false};
      }
    }
  }
}