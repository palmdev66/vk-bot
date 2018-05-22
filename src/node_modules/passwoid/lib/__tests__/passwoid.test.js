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

const uniq = require('lodash.uniq');
const passwoid = require('../passwoid');

describe('passwoid', () => {
  test('default length', () => {
    expect(passwoid().length).toBe(16);
  });

  test('specific length', () => {
    expect(passwoid(8).length).toBe(8);
  });

  test('length longer than pool length', () => {
    expect(passwoid(64).length).toBe(64);
  });

  test('length too short', () => {
    expect(() => {
      passwoid(1);
    }).toThrow('Cannot generate password of length 1');
  });

  test('all three character classes', () => {
    const password = passwoid();
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/\d/);
  });

  test('does not repeat characters', () => {
    expect(uniq(passwoid(16).split('')).length).toBe(16);
  });

  test('repeats characters', () => {
    expect(uniq(passwoid(64).split('')).length).not.toBe(64);
  });

  test('passwords are not identical', () => {
    const password1 = passwoid();
    const password2 = passwoid();
    expect(password1).not.toBe(password2);
  });
});
