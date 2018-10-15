import * as fs from 'fs';
import * as path from 'path';
import * as lernaJson from '../lerna.json';

const rootPath = path.resolve(__dirname, '..');
const packagesPath = path.join(rootPath, 'packages');

export default {
  lerna: lernaJson,
  packages: fs
    .readdirSync(packagesPath)
    .filter(p => fs.lstatSync(path.join(packagesPath, p)).isDirectory())
    .map(p => {
      const pkgName = path.basename(p);
      const pkgPath = path.join(packagesPath, p);
      const pkgSrc = path.join(pkgPath, 'src');
      const pkgScopedName = `@zilliqa/${p}`;
      const pkgDist = path.join(pkgPath, 'dist');

      const pkgUmd = path.join(pkgDist, 'index.umd.js');
      const pkgEsm = path.join(pkgDist, 'index.esm.js');
      const pkgSystem = path.join(pkgDist, 'index.system.js');
      const pkgAmd = path.join(pkgDist, 'index.amd.js');
      const pkgCjs = path.join(pkgDist, 'index.cjs.js');
      const pkgIife = path.join(pkgDist, 'index.js');

      return {
        name: pkgName,
        path: pkgPath,
        src: pkgSrc,
        scopedName: pkgScopedName,
        dist: pkgDist,
        umd: pkgUmd,
        esm: pkgEsm,
        system: pkgSystem,
        amd: pkgAmd,
        cjs: pkgCjs,
        iife: pkgIife,
      };
    }),
};
