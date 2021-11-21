const assert  = require('assert');
const RandExp = require('..');

let lastChoices = [];
const gen = function(arg, match, useChoices) {
  const r = new RandExp(arg);
  r.randInt = (function(a, b) {
      return a + Math.floor(.5 * (1 + b - a));
  }).bind(r);

  const rv = r.gen(match, useChoices);
  lastChoices = r.lastChoices;
  return rv;
};


describe('Match input', () => {
  it('Should match simple', () => {
    // Seed produces @
    assert.equal(gen(/./, 'a'), 'a');
    assert.deepEqual(lastChoices, [97]);
    assert.equal(gen(/./, undefined, lastChoices), 'a');

    assert.equal(gen(/./, 'b'), 'b');
    assert.deepEqual(lastChoices, [98]);
    assert.equal(gen(/./, undefined, lastChoices), 'b');

    assert.equal(gen(/../, 'ab'), 'ab');
    assert.deepEqual(lastChoices, [97, 98]);
    assert.equal(gen(/../, undefined, lastChoices), 'ab');

    assert.equal(gen(/../, 'nz'), 'nz');
    assert.deepEqual(lastChoices, [110, 122]);
    assert.equal(gen(/../, undefined, lastChoices), 'nz');
  });

  it('Should match group', () => {
    assert.equal(gen(/(a|b)c/, 'ac'), 'ac');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/(a|b)c/, undefined, lastChoices), 'ac');

    assert.equal(gen(/(a|b)c/, 'bc'), 'bc');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/(a|b)c/, undefined, lastChoices), 'bc');

    assert.equal(gen(/(ab|cd)e/, 'abe'), 'abe');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/(ab|cd)e/, undefined, lastChoices), 'abe');

    assert.equal(gen(/(ab|cd)e/, 'cde'), 'cde');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/(ab|cd)e/, undefined, lastChoices), 'cde');
  });

  it('Should match partial', () => {
    assert.equal(gen(/(ab|cd)e/, 'abf'), 'abe');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/(ab|cd)e/, undefined, lastChoices), 'abe');
  });

  it('Should match repetition', () => {
    // First choice for repetition is irrelevant for matched cases.
    // It's the random number we would have taken if no match was given.
    assert.equal(gen(/ca?b/, 'cab'), 'cab');
    assert.deepEqual(lastChoices, [1, 1]);
    assert.equal(gen(/ca?b/, undefined, lastChoices), 'cab');

    assert.equal(gen(/ca?b/, 'cb'), 'cb');
    assert.deepEqual(lastChoices, [1, 0]);
    assert.equal(gen(/ca?b/, undefined, lastChoices), 'cb');

    assert.equal(gen(/ca?b/, 'caab'), 'cab');
    assert.deepEqual(lastChoices, [1, 1]);
    assert.equal(gen(/ca?b/, undefined, lastChoices), 'cab');

    assert.equal(gen(/a{3,5}/, 'aaa'), 'aaa');
    assert.deepEqual(lastChoices, [4, 3]);
    assert.equal(gen(/a{3,5}/, undefined, lastChoices), 'aaa');

    assert.equal(gen(/a{3,5}/, 'aaaa'), 'aaaa');
    assert.deepEqual(lastChoices, [4, 4]);
    assert.equal(gen(/a{3,5}/, undefined, lastChoices), 'aaaa');

    assert.equal(gen(/a{3,5}/, 'aaaaa'), 'aaaaa');
    assert.deepEqual(lastChoices, [4, 5]);
    assert.equal(gen(/a{3,5}/, undefined, lastChoices), 'aaaaa');

    assert.equal(gen(/a{3,5}/, 'aaaaaa'), 'aaaaa');
    assert.deepEqual(lastChoices, [4, 5]);
    assert.equal(gen(/a{3,5}/, undefined, lastChoices), 'aaaaa');

    assert.equal(gen(/a+/, 'aaaaaa'), 'aaaaaa');
    assert.deepEqual(lastChoices, [1, 6]);
    assert.equal(gen(/a+/, undefined, lastChoices), 'aaaaaa');

    assert.equal(gen(/a+/, 'aaaaa'), 'aaaaa');
    assert.deepEqual(lastChoices, [1, 5]);
    assert.equal(gen(/a+/, undefined, lastChoices), 'aaaaa');

    assert.equal(gen(/ab+c/, 'abbc'), 'abbc');
    assert.deepEqual(lastChoices, [1, 2]);
    assert.equal(gen(/ab+c/, undefined, lastChoices), 'abbc');

    assert.equal(gen(/ab+c/, 'abc'), 'abc');
    assert.deepEqual(lastChoices, [1, 1]);
    assert.equal(gen(/ab+c/, undefined, lastChoices), 'abc');

    assert.equal(gen(/ab*c/, 'ac'), 'ac');
    assert.deepEqual(lastChoices, [0, 0]);
    assert.equal(gen(/ab*c/, undefined, lastChoices), 'ac');

    assert.equal(gen(/ab*c/, 'abbbbc'), 'abbbbc');
    assert.deepEqual(lastChoices, [0, 4]);
    assert.equal(gen(/ab*c/, undefined, lastChoices), 'abbbbc');

    assert.equal(gen(/ab*c/, 'abc'), 'abc');
    assert.deepEqual(lastChoices, [0, 1]);
    assert.equal(gen(/ab*c/, undefined, lastChoices), 'abc');
  });

  it('Should match partial', () => {
    assert.equal(gen(/^a(b|c)$/, 'qqqac'), 'ac');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/^a(b|c)$/, undefined, lastChoices), 'ac');

    assert.equal(gen(/^a(b|c)$/, 'qqqab'), 'ab');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/^a(b|c)$/, undefined, lastChoices), 'ab');

    assert.equal(gen(/^a(b|c)$/, 'aqqqc'), 'ac');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/^a(b|c)$/, undefined, lastChoices), 'ac');

    assert.equal(gen(/^a(b|c)$/, 'aqqqb'), 'ab');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/^a(b|c)$/, undefined, lastChoices), 'ab');

    assert.equal(gen(/^a(b|c)$/, 'acqqq'), 'ac');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/^a(b|c)$/, undefined, lastChoices), 'ac');

    assert.equal(gen(/^a(b|c)$/, 'abqqq'), 'ab');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/^a(b|c)$/, undefined, lastChoices), 'ab');
  });

  it('Should match nested', () => {
    assert.equal(gen(/^a((b|c)|(d|e))$/, 'ab'), 'ab');
    assert.deepEqual(lastChoices, [0, 0]);
    assert.equal(gen(/^a((b|c)|(d|e))$/, undefined, lastChoices), 'ab');

    assert.equal(gen(/^a((b|c)|(d|e))$/, 'ac'), 'ac');
    assert.deepEqual(lastChoices, [0, 1]);
    assert.equal(gen(/^a((b|c)|(d|e))$/, undefined, lastChoices), 'ac');

    assert.equal(gen(/^a((b|c)|(d|e))$/, 'ad'), 'ad');
    assert.deepEqual(lastChoices, [1, 0]);
    assert.equal(gen(/^a((b|c)|(d|e))$/, undefined, lastChoices), 'ad');

    assert.equal(gen(/^a((b|c)|(d|e))$/, 'ae'), 'ae');
    assert.deepEqual(lastChoices, [1, 1]);
    assert.equal(gen(/^a((b|c)|(d|e))$/, undefined, lastChoices), 'ae');
  });
});
