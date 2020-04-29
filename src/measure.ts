import Beat from './beat';
import Song from './notochord-song';

function isMeasureContainer(value: any): value is SongDataMeasureContainer {
  return !!value.type;
}

/**
 * Handles repeats and stuff
 */
export class MeasureContainer {
  public type: 'repeat' | 'ending';
  public measures: (Measure | MeasureContainer)[];
  public repeatInfo: {
    repeatCount?: number;
    ending?: number;
  };

  private static DEFAULTS = {
    measures: [],
    repeatInfo: {},
    type: 'repeat' as 'repeat',
  }

  public constructor(song: Song, pseudoContainer: SongDataMeasureContainer = MeasureContainer.DEFAULTS, fill = false) {
    this.type = pseudoContainer.type || 'repeat';
    if(fill) {
      const songLength = 8;
      const measureLength = Number(song.get('timeSignature')[0]);
      const pseudoMeasure = (new Array(measureLength)).fill(null) as null[];
      this.measures = [];
      for(let i = 0; i < songLength; i++) {
        this.measures.push(new Measure(song, pseudoMeasure));
      }
    } else {
      this.measures = [];
      for(const pseudoMeasure of pseudoContainer.measures) {
        if(isMeasureContainer(pseudoMeasure)) {
          this.measures.push(new MeasureContainer(song, pseudoMeasure));
        } else {
          this.measures.push(new Measure(song, pseudoMeasure));
        }
      }
    }
    this.repeatInfo = { ...pseudoContainer.repeatInfo };
  }
  public serialize(): SongDataMeasureContainer {
    return {
      type: this.type,
      measures: this.measures.map(measure => measure.serialize()),
      repeatInfo: this.repeatInfo
    };
  }
  public *[Symbol.iterator](): Iterator<Measure> {
    const repeatCount = this.type === 'repeat' ? this.repeatInfo.repeatCount! : 1;
    for(let repeat = 1; repeat <= repeatCount; repeat++) {
      m: for(const measure of this.measures) {
        if(measure instanceof MeasureContainer) {
          if(measure.type === 'repeat') {
            yield* measure;
          } else if(measure.type === 'ending') {
            if(measure.repeatInfo.ending === repeat) {
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
  }
}

export class Measure {
  public song: Song;
  public index?: number;
  public length: number;
  public beats: Beat[];

  public constructor(song: Song, pseudoMeasure: (string | null)[]) {
    this.song = song;
    this.length = song.get('timeSignature')[0];
    this.beats = pseudoMeasure.map((pseudoBeat, index) =>
      new Beat(this.song, this, index, pseudoBeat)
    );
  }
  public serialize(): (string | null)[] {
    return this.beats.map(beat => beat.serialize());
    // @todo props like repeats and stuff
  }
}