// Copyright 2015, 2016 Mark Cornick
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const defaultPool = function(length) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const repeats = parseInt((length - 1) / alphabet.length, 10) + 1;
  let pool = [];
  for (let i = 1; i <= repeats; i++) {
    pool = pool.concat(alphabet.split(''));
  }
  return pool;
};

const randomCharacter = function(pool) {
  const index = Math.floor(Math.random() * pool.length);
  const character = pool[index];
  pool.splice(index, 1);
  return character;
};

const acceptable = function(pw) {
  return pw.match(/[A-Z]/) && pw.match(/[a-z]/) && pw.match(/\d/);
};

const generatePassword = function(pool, length) {
  const results = [];
  for (let i = 1; i <= length; i++) {
    results.push(randomCharacter(pool));
  }
  return results.join('');
};

module.exports = function(length) {
  if (typeof length === 'undefined') {
    length = 16;
  }
  if (length < 3) {
    throw new Error(`Cannot generate password of length ${length}`);
  } else {
    let password = '';
    while (!acceptable(password)) {
      const currentPool = defaultPool(length);
      password = generatePassword(currentPool, length);
    }
    return password;
  }
};
