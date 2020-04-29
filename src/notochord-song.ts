import SongIterator from './songiterator.js';
import { Measure, MeasureContainer } from './measure';
import * as _Tonal from 'tonal';
const Tonal = (_Tonal as any).default || _Tonal;

export default class Song {
  private props: Map<string, any>;
  private callbackMap: Map<string, Set<(newValue: any) => void>>;
  public measureContainer: MeasureContainer;
  public measures: Measure[];

  private static DEFAULTS = {
    title: '',
    tempo: 120,
    key: 'C' as IKey,
    transpose: 0,
    timeSignature: [4,4] as [number, number],
    measureContainer: null,
  }

  public constructor(pseudoSong: SongData = Song.DEFAULTS) {
    this.props = new Map(Object.entries({ ...this._makeDefaultProps(), ...pseudoSong, measureContainer: undefined }));
    this.callbackMap = new Map();
    this.measureContainer = new MeasureContainer(this, pseudoSong.measureContainer || undefined, !pseudoSong.measureContainer);
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
  public getTransposedKey(): string {
    const [pc, quality] = Tonal.Chord.tokenize(this.props.get('key'));
    const interval = Tonal.Interval.fromSemitones(this.props.get('transpose'));
    return Tonal.transpose(pc, interval) + quality;
  }
  /**
   * Subscribe to changes to a property of the song (except measureContainer)
   * @param {string} property Property to subscribe to changes to
   * @param {function} callback Function that is passed the new value when the property updates
   */
  public onChange(property: string, callback: (newValue: any) => void): void {
    if(!this.callbackMap.has(property)) this.callbackMap.set(property, new Set())
    this.callbackMap.get(property)!.add(callback);
  }
  /**
   * Get a property of the song (except measureContainer)
   * @param {string} property 
   * @returns {*} The value of that property (or undefined)
   */
  public get(property: string): any {
    return this.props.get(property);
  }
  /**
   * Set a property of the song, and notify those subscribed to changes to that property.
   * @param {string} property 
   * @param {*} value 
   */
  public set(property: string, value: any): void {
    this.props.set(property, value);
    this._emitChange(property, value);
  }
  /**
   * Generate default prop values. Can't just use a constant because the dates
   * change per runtime
   * @returns {Object}
   * @private
   */
  private _makeDefaultProps(): object {
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
  public _emitChange(prop: string, value: any): void {
    const cbs = this.callbackMap.get(prop);
    if(cbs) {
      for(const cb of cbs) cb(value);
    }
  }
  public serialize(): SongData {
    // aww Object.fromEntries isn't ready yet :(
    const out: Partial<SongData> = { measureContainer: null };
    for(const [key, val] of this.props) {
      out[key] = val;
    }
    out.measureContainer = this.measureContainer.serialize();
    return out as SongData;
  }
  public [Symbol.iterator](): SongIterator {
    return new SongIterator(this);
  }
}