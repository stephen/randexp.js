const assert  = require('assert');
const RandExp = require('..');

let lastChoices = [];
const gen = function(arg, match) {
  const r = new RandExp(arg);
  r.randInt = (function(a, b) {
      return a + Math.floor(.5 * (1 + b - a));
  }).bind(r);

  const rv = r.gen(match);
  lastChoices = r.lastChoices;
  return rv;
};


describe('Match input', () => {
  it('Should match simple', () => {
    // Seed produces @
    assert.equal(gen(/./, 'a'), 'a');
    assert.deepEqual(lastChoices, []);
    assert.equal(gen(/./, 'b'), 'b');
    assert.deepEqual(lastChoices, []);

    // Seed produces @@
    assert.equal(gen(/../, 'ab'), 'ab');
    assert.deepEqual(lastChoices, []);
    assert.equal(gen(/../, 'nz'), 'nz');
    assert.deepEqual(lastChoices, []);
  });

  it('Should match group', () => {
    assert.equal(gen(/(a|b)c/, 'ac'), 'ac');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/(a|b)c/, 'bc'), 'bc');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/(ab|cd)e/, 'abe'), 'abe');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/(ab|cd)e/, 'cde'), 'cde');
    assert.deepEqual(lastChoices, [1]);
  });

  it('Should match partial', () => {
    assert.equal(gen(/(ab|cd)e/, 'abf'), 'abe');
    assert.deepEqual(lastChoices, [0]);
  });

  it('Should match repetition', () => {
    // First choice for repetition is irrelevant for matched cases.
    // It's the random number we would have taken if no match was given.
    assert.equal(gen(/ca?b/, 'cab'), 'cab');
    assert.deepEqual(lastChoices, [1, 1]);
    assert.equal(gen(/ca?b/, 'cb'), 'cb');
    assert.deepEqual(lastChoices, [1, 0]);
    assert.equal(gen(/ca?b/, 'caab'), 'cab');
    assert.deepEqual(lastChoices, [1, 1]);
    assert.equal(gen(/a{3,5}/, 'aaa'), 'aaa');
    assert.deepEqual(lastChoices, [4, 3]);
    assert.equal(gen(/a{3,5}/, 'aaaa'), 'aaaa');
    assert.deepEqual(lastChoices, [4, 4]);
    assert.equal(gen(/a{3,5}/, 'aaaaa'), 'aaaaa');
    assert.deepEqual(lastChoices, [4, 5]);
    assert.equal(gen(/a{3,5}/, 'aaaaaa'), 'aaaaa');
    assert.deepEqual(lastChoices, [4, 5]);
    assert.equal(gen(/a+/, 'aaaaaa'), 'aaaaaa');
    assert.deepEqual(lastChoices, [1, 6]);
    assert.equal(gen(/a+/, 'aaaaa'), 'aaaaa');
    assert.deepEqual(lastChoices, [1, 5]);
    assert.equal(gen(/ab+c/, 'abbc'), 'abbc');
    assert.deepEqual(lastChoices, [1, 2]);
    assert.equal(gen(/ab+c/, 'abc'), 'abc');
    assert.deepEqual(lastChoices, [1, 1]);
    assert.equal(gen(/ab*c/, 'ac'), 'ac');
    assert.deepEqual(lastChoices, [0, 0]);
    assert.equal(gen(/ab*c/, 'abbbbc'), 'abbbbc');
    assert.deepEqual(lastChoices, [0, 4]);
    assert.equal(gen(/ab*c/, 'abc'), 'abc');
    assert.deepEqual(lastChoices, [0, 1]);
  });

  it('Should match partial', () => {
    assert.equal(gen(/^a(b|c)$/, 'qqqac'), 'ac');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/^a(b|c)$/, 'qqqab'), 'ab');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/^a(b|c)$/, 'aqqqc'), 'ac');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/^a(b|c)$/, 'aqqqb'), 'ab');
    assert.deepEqual(lastChoices, [0]);
    assert.equal(gen(/^a(b|c)$/, 'acqqq'), 'ac');
    assert.deepEqual(lastChoices, [1]);
    assert.equal(gen(/^a(b|c)$/, 'abqqq'), 'ab');
    assert.deepEqual(lastChoices, [0]);
  });
});
