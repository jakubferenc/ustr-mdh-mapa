import json from '@rollup/plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  {
  input: 'src/main.js',
  output: {
    dir: 'output',
    format: ''
  },
  plugins: [json(), nodeResolve(), terser()]
  },
  {
    input: 'node_modules/mapbox-gl/dist/mapbox-gl-unminified.js',
    output: {
        file: 'dist/mapbox-gl.esm.js',
        format: 'esm',
    },
    plugins: [commonjs()],
  }
];

