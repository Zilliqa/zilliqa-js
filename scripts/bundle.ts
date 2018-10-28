import * as path from 'path';
import * as rollup from 'rollup';
import project from './project';
import alias from 'rollup-plugin-alias';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import typescript2 from 'rollup-plugin-typescript2';
import webpack from 'webpack';
import ts from 'typescript';
import { createLogger, c } from './logger';

const logPreProcess = createLogger('preprocess');
const logBundle = createLogger('bundle');

/**
 * preProcess
 *
 * This function exists for the purpose of preprocessing problematic
 * third-party modules like elliptic.js with webpack, which cause problems
 * with rollup due to things like circular dependencies.
 */
function preProcess() {
  const modules = project.preprocess.map((mod) => {
    return new Promise((resolve, reject) => {
      const compiler = webpack({
        entry: {
          [mod.name]: path.join(mod.path, mod.entry),
        },
        output: {
          filename: '[name].js',
          library: mod.name,
          libraryTarget: 'commonjs2',
          path: mod.outDir,
        },
        mode: 'production',
        optimization: {
          minimize: false,
        },
      });

      compiler.run((err, stats) => {
        if (err) {
          reject(err);
        } else {
          logPreProcess(
            `Successfully preprocessed ${Object.keys(
              stats.compilation.assets,
            ).join(' ,')}`,
          );
          resolve(stats);
        }
      });
    });
  });

  return Promise.all(modules);
}

async function bundle() {
  try {
    const outputs = process.argv.slice(2)[0].split(',');
    const packages = project.packages;

    await preProcess();

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
            elliptic: 'includes/elliptic/elliptic.js',
          }),
          resolve({
            browser: true,
            jsnext: true,
            preferBuiltins: false,
          }),
          commonjs(),
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
          .map((p) => p.scopedName),
      });

      //'amd' | 'cjs' | 'system' | 'es' | 'esm' | 'iife' | 'umd'
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
    logBundle(`Failed to bundle: ${err}`);
    process.exit(1);
  }
}

bundle();
