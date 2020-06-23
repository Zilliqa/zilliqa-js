//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
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
import * as tjs from 'typescript-json-schema';

import project from './project';
import tsConfig from '../tsconfig.base.json';

const outputs = process.argv.slice(2)[0].split(',');

async function generateSchemas() {
  project.packages
    // @ts-ignore
    .filter((pkg) => {
      return (
        pkg.name !== 'zilliqa-js' &&
        outputs.indexOf(pkg.name.replace('zilliqa-js-', '')) !== -1
      );
    })
    .forEach((pkg) => {
      const settings = {
        ref: false,
      };

      const tsConfig: tjs.CompilerOptions = {
        lib: ['es2015'],
      };

      const prog = tjs.getProgramFromFiles(
        [path.resolve(path.join(pkg.src, 'types.ts'))],
        tsConfig,
      );

      const schema = tjs.generateSchema(prog, '*', settings);

      fs.writeFileSync(
        path.join(pkg.path, 'test', 'schema.json'),
        JSON.stringify(schema, undefined, 2),
      );
    });
}

generateSchemas();
