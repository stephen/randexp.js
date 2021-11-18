const assert  = require('assert');
const RandExp = require('..');

const gen = function(arg, match) {
  const r = new RandExp(arg);
  r.randInt = (function(a, b) {
      return a + Math.floor(.5 * (1 + b - a));
  }).bind(r);

  return r.gen(match);
};


describe('Match input', () => {
  it('Should match simple', () => {
    // Seed produces @
    assert.equal(gen(/./, 'a'), 'a');
    assert.equal(gen(/./, 'b'), 'b');

    // Seed produces @@
    assert.equal(gen(/../, 'ab'), 'ab');
    assert.equal(gen(/../, 'nz'), 'nz');
  });

  it('Should match group', () => {
    assert.equal(gen(/(a|b)c/, 'ac'), 'ac');
    assert.equal(gen(/(a|b)c/, 'bc'), 'bc');
    assert.equal(gen(/(ab|cd)e/, 'abe'), 'abe');
    assert.equal(gen(/(ab|cd)e/, 'cde'), 'cde');
  });

  it('Should match partial', () => {
    assert.equal(gen(/(ab|cd)e/, 'abf'), 'abe');
  });

  it('Should match repetition', () => {
    assert.equal(gen(/ca?b/, 'cab'), 'cab');
    assert.equal(gen(/ca?b/, 'cb'), 'cb');
    assert.equal(gen(/ca?b/, 'caab'), 'cab');
    assert.equal(gen(/a{3,5}/, 'aaa'), 'aaa');
    assert.equal(gen(/a{3,5}/, 'aaaa'), 'aaaa');
    assert.equal(gen(/a{3,5}/, 'aaaaa'), 'aaaaa');
    assert.equal(gen(/a{3,5}/, 'aaaaaa'), 'aaaaa');
    assert.equal(gen(/a+/, 'aaaaaa'), 'aaaaaa');
    assert.equal(gen(/a+/, 'aaaaa'), 'aaaaa');
    assert.equal(gen(/ab+c/, 'abbc'), 'abbc');
    assert.equal(gen(/ab+c/, 'abc'), 'abc');
    assert.equal(gen(/ab*c/, 'ac'), 'ac');
    assert.equal(gen(/ab*c/, 'abbbbc'), 'abbbbc');
    assert.equal(gen(/ab*c/, 'abc'), 'abc');
  });

  it('Should match partial', () => {
    assert.equal(gen(/^a(b|c)$/, 'qqqac'), 'ac');
    assert.equal(gen(/^a(b|c)$/, 'qqqab'), 'ab');
    assert.equal(gen(/^a(b|c)$/, 'aqqqc'), 'ac');
    assert.equal(gen(/^a(b|c)$/, 'aqqqb'), 'ab');
    assert.equal(gen(/^a(b|c)$/, 'acqqq'), 'ac');
    assert.equal(gen(/^a(b|c)$/, 'abqqq'), 'ab');
  });
});
