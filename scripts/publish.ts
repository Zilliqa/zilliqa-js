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

import lerna from 'lerna';

import project from './project';
import { createLogger } from './logger';

const DIST_TAG = 'next';

const log = createLogger('publish');

const getVersion = async () => {
  const re = /(\d+)\.(\d+)\.(\d+)($|\-)/;
  const match = project.lerna.version.match(re);

  if (match === null) {
    throw new Error('Lerna version is malformed.');
  }

  const [, major, minor, patch] = match;

  return { major, minor, patch };
};

const getDate = (sep?: string): string => {
  const s = sep === undefined ? '' : sep;
  const raw = new Date()
    .toISOString()
    .replace(/:|T|\.|-/g, '')
    .slice(0, 8);
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  return `${y}${s}${m}${s}${d}`;
};

const publish = async () => {
  if (process.env.CI && process.env.TRAVIS_BRANCH !== 'master') {
    return;
  }

  try {
    const { major, minor, patch } = await getVersion();
    const version = `${major}.${minor}.${patch}-${DIST_TAG}.${getDate()}`;

    lerna([
      'publish',
      version,
      '--npm-tag',
      DIST_TAG,
      '--exact',
      '--no-git-tag-version',
      '--no-push',
      '--no-verify-access',
      '--no-verify-registry',
      '-y',
    ]);

    return version;
  } catch (err) {
    log(`Could not publish: ${err}`);
    throw err;
  }
};

publish().then((v) => log(`Published new packages with version ${v}`));
