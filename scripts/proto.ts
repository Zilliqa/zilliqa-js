import * as fs from 'fs';
import * as path from 'path';

import pbjs from 'protobufjs/cli/pbjs';
import pbts from 'protobufjs/cli/pbts';

import { createLogger, c } from './logger';
import project from './project';

const log = createLogger('protobuf');
const includes = path.resolve(__dirname, '../', 'includes');
const proto = path.join(includes, 'proto');
const compiled = path.join(proto, 'index.js');
const declaration = path.join(proto, 'index.d.ts');

const protoFiles = project.packages.reduce((files, { src }) => {
  const protoFilePath = path.resolve(src, 'messages.proto');

  if (fs.existsSync(protoFilePath)) {
    return [...files, protoFilePath];
  }

  return files;
}, []);

const compilation = new Promise((resolve, reject) => {
  pbjs.main(
    [
      '--target',
      'static-module',
      '--wrap',
      'commonjs',
      '--out',
      compiled,
      ...protoFiles,
    ],
    (err, res) => {
      if (err) {
        return reject(err);
      }

      resolve(res);
    },
  );
})
  .then(() => {
    pbts.main(['--out', declaration, '--name', 'zproto', compiled], (err) => {
      if (err) {
        log(`Could not generate protobuf files: ${err}`);
        throw err;
      }
    });
  })
  .catch((err) => process.exit(1));
