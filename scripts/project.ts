//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import * as fs from 'fs';
import * as path from 'path';
import camelcase from 'camelcase';
import * as lernaJson from '../lerna.json';

const rootPath = path.resolve(__dirname, '..');
const includesPath = path.join(rootPath, 'includes');
const packagesPath = path.join(rootPath, 'packages');

export default {
  lerna: lernaJson,
  preprocess: [
    {
      name: 'elliptic',
      path: path.resolve(__dirname, '../node_modules/elliptic'),
      entry: 'lib/elliptic.js',
      outDir: path.join(includesPath, 'elliptic'),
    },
  ],
  packages: fs
    .readdirSync(packagesPath)
    .filter((p) => fs.lstatSync(path.join(packagesPath, p)).isDirectory())
    .map((p) => {
      const pkgName = path.basename(p);
      const pkgGlobalName = camelcase(pkgName.replace('zilliqa-js', 'zjs'));
      const pkgPath = path.join(packagesPath, p);
      const pkgSrc = path.join(pkgPath, 'src');
      const pkgScopedName = `@zilliqa-js/${p.replace('zilliqa-js-', '')}`;
      const pkgDist = path.join(pkgPath, 'dist');

      const pkgUmd = path.join(pkgDist, 'index.umd.js');
      const pkgEsm = path.join(pkgDist, 'index.esm.js');
      const pkgSystem = path.join(pkgDist, 'index.system.js');
      const pkgAmd = path.join(pkgDist, 'index.amd.js');
      const pkgCjs = path.join(pkgDist, 'index.cjs.js');
      const pkgIife = path.join(pkgDist, 'index.js');

      return {
        name: pkgName,
        globalName: pkgGlobalName,
        scopedName: pkgScopedName,
        path: pkgPath,
        src: pkgSrc,
        dist: pkgDist,
        umd: pkgUmd,
        esm: pkgEsm,
      };
    }),
};
