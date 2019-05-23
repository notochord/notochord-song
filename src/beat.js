// Gimme import maps, I don't need this noise
import Tonal from 'https://dev.jspm.io/tonal@2.2.2';
//import Tonal from 'tonal';

const SCALE_DEGREES = {
  1: {numeral: 'i',   flat: false},
  2: {numeral: 'ii',  flat: true},
  3: {numeral: 'ii',  flat: false},
  4: {numeral: 'iii', flat: true},
  5: {numeral: 'iii', flat: false},
  6: {numeral: 'iv',  flat: false},
  7: {numeral: 'v',   flat: true},
  8: {numeral: 'v',   flat: false},
  9: {numeral: 'vi',  flat: true},
 10: {numeral: 'vi',  flat: false},
 11: {numeral: 'vii', flat: true},
 12: {numeral: 'vii', flat: false}
};

export default class Beat {
  constructor(song, pseudoBeat) {
    this.song = song;

    this.chord = pseudoBeat;
  }
  /**
   * 
   * @param {?string} rawChord 
   */
  set chord(rawChord) {
    this._chord = null;
    if(rawChord) {
      let parsed = rawChord.replace(/-/g, 'm');
      const chordParts = Tonal.Chord.tokenize(parsed);
      if(/*transpose && */this.song.get('transpose') && chordParts[0]) {
        chordParts[0] = Tonal.Note.enharmonic(
          Tonal.transpose(
            chordParts[0],
            Tonal.Interval.invert(song.transposeInt)
          )
        );
      }
      
      // get the shortest chord name
      if(chordParts[1]) {
        let names = Tonal.Chord.props(chordParts[1]).names;
        if(names && names.length) {
          chordParts[1] = names
            .reduce((l, r) => l.length <= r.length ? l : r)
            .replace(/_/g, 'm7');
        } else {
          chordParts[1] = '';
        }
      }
      parsed = chordParts.join('');
      this._chord = parsed;
    }
  }
  get chord() {
    const transpose = this.song.get('transpose');
    const transposeInt = Tonal.Interval.fromSemitones(transpose);
    const chord = this._chord;
    if(chord) {
      if(transpose) {
        let chordParts = Tonal.Chord.tokenize(chord);
        chordParts[0] = Tonal.Note.enharmonic(
          Tonal.transpose(chordParts[0], transposeInt)
        );
        return chordParts.join('');
      } else {
        return chord;
      }
    } else {
      return null;
    }
  }
  get scaleDegree() {
    const chord = this._chord;
    if(!chord) return null;

    const chordParts = Tonal.Chord.tokenize(chord);
    // ignore transposition because it's relative to the 1
    const semis = Tonal.Distance.semitones(this.song.get('key'), chordParts[0]) + 1;
    const minorish = chordParts[1][0] == 'm' || chordParts[1][0] == 'o';
    const SD = SCALE_DEGREES[semis];
    return {
      numeral: minorish ? SD.numeral : SD.numeral.toUpperCase(),
      flat: SD.flat
    };
  }
  serialize() {
    return this.chord;
  }
}