import { terser } from 'rollup-plugin-terser'
import filesize from 'rollup-plugin-filesize'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'index.js',
      format: 'es',
      plugins: [filesize()]
    },
    {
      file: 'index.min.js',
      format: 'es',
      plugins: [terser()]
    }
  ]
}
