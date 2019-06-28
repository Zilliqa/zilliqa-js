//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <https://www.gnu.org/licenses/>.

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

import * as rollup from 'rollup';
import alias from 'rollup-plugin-alias';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import globals from 'rollup-plugin-node-globals';
import resolve from 'rollup-plugin-node-resolve';
import typescript2 from 'rollup-plugin-typescript2';
import webpack from 'webpack';
import ts from 'typescript';

import project from './project';
import { createLogger, c } from './logger';

const logPreProcess = createLogger('preprocess');
const logBundle = createLogger('bundle');

async function bundle() {
  try {
    const outputs = process.argv.slice(2)[0].split(',');
    const packages = project.packages.filter(
      ({ name }) => name !== 'zilliqa-js-proto',
    );

    const count = packages.length;
    let cur = 0;
    for (const pkg of packages) {
      const logPrefix = c.grey(`[${++cur}/${count}] ${pkg.scopedName}`);
      logBundle(`${logPrefix} creating bundle`);

      const externals = project.packages
        .filter((p) => p.name !== pkg.name)
        .map((p) => p.scopedName);

      logBundle(`externals: ${externals}`);

      const bundle = await rollup.rollup({
        input: path.join(pkg.src, 'index.ts'),
        plugins: [
          alias({
            proto: path.resolve(__dirname, '../', 'includes/proto/index.js'),
          }),
          resolve({
            browser: true,
            jsnext: true,
            preferBuiltins: true,
          }),
          commonjs({
            namedExports: {
              [path.resolve(__dirname, '../', 'includes/proto/index.js')]: [
                'ZilliqaMessage',
              ],
            },
          }),
          globals(),
          json(),
          typescript2({
            tsconfig: path.join(pkg.path, 'tsconfig.json'),
            typescript: ts, // ensure we're using the same typescript (3.x) for rollup as for regular builds etc
            tsconfigOverride: {
              module: 'esnext',
              stripInternal: true,
              emitDeclarationOnly: false,
              composite: false,
              declaration: false,
              declarationMap: false,
              sourceMap: true,
            },
          }),
        ],
        // mark all packages that are not *this* package as external so they don't get included in the bundle
        // include tslib in the bundles since only __decorate is really used by multiple packages (we can figure out a way to deduplicate that later on if need be)
        external: project.packages
          .filter((p) => p.name !== pkg.name)
          .map((p) => p.scopedName)
          .concat(['cross-fetch']),
      });

      // 'amd' | 'cjs' | 'system' | 'es' | 'esm' | 'iife' | 'umd'
      if (outputs.indexOf('esm') === -1) {
        logBundle(`${logPrefix} skipping esm`);
      } else {
        logBundle(`${logPrefix} writing esm - ${pkg.esm}`);

        await bundle.write({
          file: pkg.esm,
          name: pkg.globalName,
          format: 'esm',
          sourcemap: true,
        });
      }

      if (outputs.indexOf('umd') === -1) {
        logBundle(`${logPrefix} skipping umd`);
      } else {
        logBundle(`${logPrefix} writing umd - ${pkg.umd}`);

        await bundle.write({
          file: pkg.umd,
          exports: 'named',
          name: pkg.globalName,
          globals: {
            ...project.packages.reduce((g, pkg) => {
              g[pkg.scopedName] = pkg.globalName;
              return g;
            }, {}),
            tslib: 'tslib',
          },
          format: 'umd',
          sourcemap: true,
        });
      }
    }
  } catch (err) {
    logBundle('Failed to bundle:');
    logBundle(err);
    process.exit(1);
  }
}

bundle();
