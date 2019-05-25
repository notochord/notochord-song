import Tonal from 'https://dev.jspm.io/tonal@2.2.2';
//import * as Tonal from 'tonal';
import SongIterator from './songiterator.js';
import { MeasureContainer } from './measure.js';

export default class Song {
  constructor(pseudoSong = {}) {
    this._props = new Map(Object.entries({...this._makeDefaultProps(), ...pseudoSong, measureContainer: undefined}));
    this._callbackMap = new Map();
    this.measureContainer = new MeasureContainer(this, pseudoSong.measureContainer, !pseudoSong.measureContainer);
    this.measures = [...this.measureContainer]; // depends on the naive asumption that songs have finite length
    this.measures.forEach((measure, index) => {
      if(measure.index === undefined) {
        measure.index = index;
      }
    });
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
   * Subscribe to changes to a property of the song (except measureContainer)
   * @param {string} property Property to subscribe to changes to
   * @param {function} callback Function that is passed the new value when the property updates
   */
  onChange(property, callback) {
    if(!this._callbackMap.has(property)) this._callbackMap.set(property, new Set())
    this._callbackMap.get(property).add(callback);
  }
  /**
   * Get a property of the song (except measureContainer)
   * @param {string} property 
   * @returns {*} The value of that property (or undefined)
   */
  get(property) {
    return this._props.get(property);
  }
  /**
   * Set a property of the song, and notify those subscribed to changes to that property.
   * @param {string} property 
   * @param {*} value 
   */
  set(property, value) {
    this._props.set(property, value);
    this._emitChange(property, value);
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
  _emitChange(prop, value) {
    const cbs = this._callbackMap.get(prop);
    if(cbs) {
      for(const cb of cbs) cb(value);
    }
  }
  serialize() {
    // aww Object.fromEntries isn't ready yet :(
    const out = {};
    for(const [key, val] of this._props) {
      out[key] = val;
    }
    out.measureContainer = this.measureContainer.serialize();
    return out;
  }
  [Symbol.iterator]() {
    return new SongIterator(this);
  }
}