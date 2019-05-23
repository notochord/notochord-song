import Tonal from 'https://dev.jspm.io/tonal@2.2.2';
import SongIterator from './songiterator.js';
import {MeasureContainer} from './measure.js';
window.Tonal = Tonal;

export default class Song {
  constructor(pseudoSong = {}) {
    this._props = new Map(Object.entries({...this._makeDefaultProps(), ...pseudoSong, measures: undefined}));
    this._callbackMap = new Map();
    this.measureContainer = new MeasureContainer(this, pseudoSong.measureContainer, !pseudoSong.measureContainer);
  }
  /**
   * Get the transposed key of the song
   * @returns {string}
   */
  getTransposedKey() {
    const [pc, quality] = Tonal.Chord.tokenize(this._props.get('key'));
    const interval = Tonal.Interval.fromSemitones(this._props.get('transpose'));
    return Tonal.transpose(pc, interval) + quality;
  }
  /**
   * Subscribe to changes to a property of the song (except measures)
   * @param {string} prop Property to subscribe to changes to
   * @param {function} callback Function that gets called when the property updates
   */
  onChange(prop, callback) {
    if(!this._callbackMap.has(prop)) this._callbackMap.set(prop, new Set())
    this._callbackMap.get(prop).add(callback);
  }
  get(prop) {
    return this._props.get(prop);
  }
  set(prop, value) {
    this._props.set(prop, value);
    const cbs = this._callbackMap.get(prop);
    if(cbs) {
      for(const cb of cbs) cb(value);
    }
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
      timeSignature: [4,4]
    };
  }
  serialize() {
    const out = Object.fromEntries(this._props);
    out.measureContainer = this.measureContainer.serialize();
    return out;
  }
  [Symbol.iterator]() {
    return new SongIterator(this);
  }
}