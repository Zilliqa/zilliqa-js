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
