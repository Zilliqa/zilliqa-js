import lerna from 'lerna';
import * as childproc from 'child_process';

import project from './project';
import { createLogger, c } from './logger';

const DIST_TAG = 'next';

const log = createLogger('publish');

const getVersion = async () => {
  const re = /(\d+)\.(\d+)\.(\d+)($|\-)/;
  const match = project.lerna.version.match(re);

  if (match === null) {
    throw new Error('Lerna version is malformed.');
  }

  const [major, minor, patch] = match;

  return { major, minor, patch };
};

const getCommitSHA = async () => {
  return new Promise((resolve, reject) => {
    childproc.exec('git rev-parse --short=7 HEAD', (err, stdout) => {
      if (err) {
        return reject(err);
      }

      resolve(stdout);
    });
  });
};

const publish = async () => {
  if (process.env.CI && process.env.TRAVIS_BRANCH !== 'master') {
    return;
  }

  try {
    const { major, minor, patch } = await getVersion();
    const sha = await getCommitSHA();
    const version = `${major}.${minor}.${patch}-${sha}`;

    lerna([
      'publish',
      version,
      '--npm-tag',
      DIST_TAG,
      '--no-git-tag-version',
      '--no-push',
      '--no-verify-registry',
      '--no-verify-access',
      '-y',
    ]);

    return version;
  } catch (err) {
    log(`Could not publish: ${err}`);
    throw err;
  }
};

publish().then((v) => log(`Published new packages with version ${v}`));
