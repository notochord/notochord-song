class Measure {
  constructor(song, index, pseudoMeasure) {
    this.length = song.get('time_signature')[0];
    this._beats = pseudoMeasure.map(pseudoBeat => {
      if(pseudoBeat === null) {
        return null
      } else {
        return new Beat(pseudoBeat);
      }
    })
  }
  getBeat(beat_index) {

  }
  getScaleDegree(beat_index) {

  }
  setIndex(new_index) {

  }
}

export default class Song {
  constructor(props = {}) {
    this._propMap = new Map(Object.entries({...this._makeDefaultProps(), ...props}));
    this._propMap.delete('measures');
    this._initMeasures(props.measures);
    this._callbackMap = new Map();

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
    return this._propMap.get(prop);
  }
  set(prop, value) {
    this._propMap.set(prop, value);
    const cbs = this._callbackMap.get(prop);
    if(cbs) {
      for(const cb of cbs) cb(value);
    }
  }
  /**
   * can't just use a constant because some of these are mutable :/
   */
  _makeDefaultProps() {
    return {
      title: 'New Song',
      composed_on: new Date(),
      composer: '',
      updated_on: new Date(),
      updated_by: '',
      tempo: 160,
      style: 'swing',
      key: 'C',
      transpose: 0,
      time_signature: [4,4]
    };
  }
  _initMeasures(propMeasures) {
    if(propMeasures) {
      this.measures = measures;
    } else {
      const length = 8;
      const measureLength = this._propMap.get('time_signature')[0];
      const emptyMeasures = [];
      for(let i = 0; i < length; i++) {
        let nullz = (new Array(measureLength)).fill(null);
        emptyMeasures.push(new Measure(nullz));
      }
      this.measures = emptyMeasures;
    }
  }
  serialize() {
    const out = Object.fromEntries(this._propMap);
    out.measures = this.measures.map(measure => measure.serialize());
    return out;
  }
  *getIterator() {
    const repeatStack = [];
    for(let measure_index = 0; measure_index < this.measures.length; measure_index++) {
      let repeatInfo = repeatStack[repeatStack.length - 1];
      let measure = this.measures[measure_index];
      if(measure.start_repeat) {
        repeatStack.push({
          start_index: measure_index,
          max_repeats: measure.max_repeats,
          repeat: 1
        })
      } else if(measure.end_repeat) {
        if(repeatInfo.repeat++ < repeatInfo.max_repeats) {
          measure_index = repeatInfo.start_index;
          measure = this.measures[measure_index];
        } else {
          if(measure.ending < repeatInfo.repeat) {
            /*while(measure && measure.ending < repeatInfo.repeat) {
              measure
            }*/
          } else {
            repeatStack.pop();
          }
        }
      }
      if(measure.ending < repeatInfo)
      yield measure;
      
    }
  }
}