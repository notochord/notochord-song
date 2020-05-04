type IKey = 'A' | 'A#' | 'Bb' | 'B' | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab'
| 'Am' | 'A#m' | 'Bbm' | 'Bm' | 'Cm' | 'C#m' | 'Dbm' | 'Dm' | 'D#m' | 'Ebm' | 'Em' | 'Fm' | 'F#m' | 'Gbm' | 'Gm' | 'G#m' | 'Abm';
type SongData = {
  title: string;
  composedOn?: number;
  composer?: string;
  updatedOn?: number;
  updatedBy?: string;
  tempo: number;
  style?: string;
  key: IKey;
  transpose: number;
  timeSignature: [number, number];
  measureContainer: SongDataMeasureContainer | null;
  [key: string]: any; // future-compatible with any other song info stored on it
};
type SongDataMeasureContainer = {
  type: 'repeat' | 'ending';
  repeatInfo: {
    repeatCount?: number;
    ending?: number;
  };
  measures: ( SongDataMeasureContainer | (null | string)[] )[];
};
type RootLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
type RootNumeral = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'i' | 'ii' | 'iii' | 'iv' | 'v' | 'vi' | 'vii';
interface ChordParts {
  rootLetter: '' | RootLetter | RootNumeral;
  accidental: '' | '#' | 'b';
  quality: string;
}