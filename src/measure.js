import Beat from './beat.js';

/**
 * Handles repeats and stuff
 */
export class MeasureContainer {
  constructor(song, pseudoContainer = {measures: [], repeatInfo: {}}, fill = false) {
    this.type = pseudoContainer.type || 'repeat';
    if(fill) {
      const songLength = 8;
      const measureLength = Number(song.get('timeSignature')[0]);
      const pseudoMeasure = {beats: (new Array(measureLength)).fill(null)};
      this.measures = [];
      for(let i = 0; i < songLength; i++) {
        this.measures.push(new Measure(song, pseudoMeasure));
      }
    } else {
      this.measures = [];
      for(const pseudoMeasure of pseudoContainer.measures) {
        if(pseudoMeasure.type) {
          this.measures.push(new MeasureContainer(song, pseudoMeasure));
        } else {
          this.measures.push(new Measure(song, pseudoMeasure));
        }
      }
    }
    this.repeatInfo = {...pseudoContainer.repeatInfo};
  }
  serialize() {
    return {
      type: 'MeasureContainer',
      measures: this.measures.map(measure => measure.serialize()),
      repeatInfo: this.repeatInfo
    };
  }
  *[Symbol.iterator]() {
    if(this.type == 'repeat') {
      for(let repeat = 1; repeat <= this.repeatInfo.repeatCount; repeat++) {
        m: for(const measure of this.measures) {
          if(measure instanceof MeasureContainer) {
            if(measure.type == 'repeat') {
              yield* measure;
            } else if(measure.type == 'ending') {
              if(measure.repeatInfo.ending == repeat) {
                yield* measure;
              } else {
                continue m;
              }
            }
          } else {
            yield measure;
          }
        }
      }
    } else {
      yield* this.measures;
    }
  }
}

export class Measure {
  constructor(song, pseudoMeasure) {
    this.song = song;
    this.length = song.get('timeSignature')[0];
    this.beats = pseudoMeasure.map(pseudoBeat =>
      new Beat(this.song, pseudoBeat)
    );
  }
  serialize() {
    return this.beats.map(beat => beat.serialize());
    // @todo props like repeats and stuff
  }
}