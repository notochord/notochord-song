import typescript from 'rollup-plugin-typescript';
import banner from 'rollup-plugin-banner';

const preamble = 'notochord-song by Jacob Bloom\nThis software is provided as-is, yadda yadda yadda';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './dist/notochord-song.cjs',
      format: 'cjs'
    },
    plugins: [
      typescript(),
      banner(preamble)
    ]
  },
  {
    input: './src/index.ts',
    output: {
      file: './dist/notochord-song.mjs',
      format: 'esm'
    },
    plugins: [
      typescript(),
      banner(preamble)
    ]
  }
];