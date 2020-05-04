import { Song } from './song';
import { Measure } from './measure';
import * as Tonal from '@tonaljs/tonal';

const SCALE_DEGREES: { [key: string]: { rootLetter: RootNumeral; accidental: 'b' | '' } } = {
  '1P': { rootLetter: 'i',   accidental: '' },
  '2m': { rootLetter: 'ii',  accidental: 'b' },
  '2M': { rootLetter: 'ii',  accidental: '' },
  '3m': { rootLetter: 'iii', accidental: 'b' },
  '3M': { rootLetter: 'iii', accidental: '' },
  '4P': { rootLetter: 'iv',  accidental: '' },
  '4A': { rootLetter: 'v',   accidental: 'b' }, // not sure what it'll give for a tritone
  '5d': { rootLetter: 'v',   accidental: 'b' },
  '5P': { rootLetter: 'v',   accidental: '' },
  '6m': { rootLetter: 'vi',  accidental: 'b' },
  '6M': { rootLetter: 'vi',  accidental: '' },
  '7m': { rootLetter: 'vii', accidental: 'b' },
  '7M': { rootLetter: 'vii', accidental: '' }
};

export class Beat {
  public song: Song;
  public measure: Measure;
  public index?: number;
  private _chord: string | null;

  public constructor(song: Song, measure: Measure, index: number, pseudoBeat: string | null) {
    this.song = song;
    this.measure = measure;
    this.index = index;
    this.chord = pseudoBeat;
  }
  /**
   * 
   * @param {?string} rawChord 
   */
  public set chord(rawChord: string | null) {
    const oldChord = this._chord;
    this._chord = this.getTransposedBy(rawChord, -1 * (this.song.get('transpose') || 0));
    this.emitChange(oldChord);
  }

  public get chord(): string | null {
    return this.getTransposedBy(this._chord, this.song.get('transpose') || 0);
  }
  public getScaleDegreeParts(): ChordParts | null {
    const chord = this._chord;
    if(!chord) return null;

    const [rootPart, quality] = Tonal.Chord.tokenize(chord);
    // ignore transposition because it's relative to the 1
    const semis = Tonal.Interval.distance(this.song.get('key'), rootPart);
    if (!semis) return null;
    const { quality: capsQuality } = Tonal.Chord.get(chord);
    const minorish = capsQuality === 'Diminished' || capsQuality === 'Minor';
    const { rootLetter, accidental } = SCALE_DEGREES[semis];
    return {
      rootLetter: minorish ? rootLetter : rootLetter.toUpperCase() as RootNumeral,
      accidental,
      quality,
    };
  }
  public getChordParts(): ChordParts | null {
    const chord = this.chord;
    if(!chord) return null;
    const [rootPart, quality] = Tonal.Chord.tokenize(chord) as string[];
    let accidental: 'b' | '#' | '' = '';
    if (rootPart[1] === 'b') accidental = 'b';
    if (rootPart[1] === '#') accidental = '#';
    return {
      rootLetter: rootPart[0] as RootLetter,
      accidental,
      quality,
    };
  }
  public changeBySemitones(semitones: number): void {
    const oldChord = this._chord;
    this._chord = this.getTransposedBy(this._chord, semitones);
    this.emitChange(oldChord)
  }
  private emitChange(oldChord: string | null): void {
    this.song._emitChange('measures', {
      type: 'Beat.chord.set',
      beatObject: this,
      measureObject: this.measure,
      oldValue: oldChord,
      newValue: this._chord,
    });
  }
  private getTransposedBy(chord: string | null, semitones: number): string | null {
    if (!chord) return null;
    const chordEscaped = chord.replace(/-/g, 'm');
    const transposeInt = Tonal.Interval.fromSemitones(semitones);
    const transposed = Tonal.Chord.transpose(chordEscaped, transposeInt);
    const { tonic, aliases } = Tonal.Chord.get(transposed);
    const shortestName = aliases ? aliases.reduce((l: string, r: string) => l.length <= r.length ? l : r) : '';
    if(tonic) {
      return Tonal.Note.simplify(tonic) + shortestName.replace(/_/g, 'm7');
    } else {
      return null;
    }
  }
  public serialize(): string | null {
    return this.chord;
  }
}