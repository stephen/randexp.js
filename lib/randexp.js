const ret    = require('ret');
const DRange = require('drange');
const types  = ret.types;


module.exports = class RandExp {
  /**
   * @constructor
   * @param {RegExp|string} regexp
   * @param {string} m
   */
  constructor(regexp, m) {
    this._setDefaults(regexp);
    if (regexp instanceof RegExp) {
      this.ignoreCase = regexp.ignoreCase;
      this.multiline = regexp.multiline;
      regexp = regexp.source;

    } else if (typeof regexp === 'string') {
      this.ignoreCase = m && m.indexOf('i') !== -1;
      this.multiline = m && m.indexOf('m') !== -1;
    } else {
      throw Error('Expected a regexp or string');
    }

    this.tokens = ret(regexp);
  }


  /**
   * Checks if some custom properties have been set for this regexp.
   *
   * @param {RandExp} randexp
   * @param {RegExp} regexp
   */
  _setDefaults(regexp) {
    // When a repetitional token has its max set to Infinite,
    // randexp won't actually generate a random amount between min and Infinite
    // instead it will see Infinite as min + 100.
    this.max = regexp.max != null ? regexp.max :
      RandExp.prototype.max != null ? RandExp.prototype.max : 100;

    // This allows expanding to include additional characters
    // for instance: RandExp.defaultRange.add(0, 65535);
    this.defaultRange = regexp.defaultRange ?
      regexp.defaultRange : this.defaultRange.clone();

    if (regexp.randInt) {
      this.randInt = regexp.randInt;
    }
  }


  /**
   * Generates the random string.
   *
   * @param {Object} match is an optional input to match against when generating the production.
   * @return {string}
   */
  gen(match) {
    const [rv, _] = this._gen(this.tokens, [], match);
    return rv;
  }


  /**
   * Generate random string modeled after given tokens.
   *
   * @param {Object} token
   * @param {Array.<string>} groups
   * @return {string} production
   * @return {int} consumed
   */
  _gen(token, groups, match) {
    let stack, str, n, i, l, code, expandedSet, consumed = 0;

    switch (token.type) {
      case types.ROOT:
      case types.GROUP:
        // Ignore lookaheads for now.
        if (token.followedBy || token.notFollowedBy) { return ['', 0]; }

        // Insert placeholder until group string is generated.
        if (token.remember && token.groupNumber === undefined) {
          token.groupNumber = groups.push(null) - 1;
        }

        if (token.options) {
          let [s, c] = this._randSelect(token.options, groups, match);
          stack = s;
          consumed += c;
        } else {
          stack = token.stack
        }

        str = '';
        for (i = 0, l = stack.length; i < l; i++) {
          let [s, c] = this._gen(stack[i], groups, match);
          str += s
          consumed += c
          if (match) {
            match = match.slice(c);
          }
        }

        if (token.remember) {
          groups[token.groupNumber] = str;
        }
        return [str, consumed];

      case types.POSITION:
        // Do nothing for now.
        return ['', 0];

      case types.SET:
        expandedSet = this._expand(token);
        if (!expandedSet.length) { return ''; }
        let [s, c] = this._randSelect(expandedSet, groups, match);
        consumed += c;
        return [String.fromCharCode(s), consumed];

      case types.REPETITION:
        // Randomly generate number between min and max.
        n = this.randInt(token.min,
          token.max === Infinity ? token.min + this.max : token.max);

        // consume up to the token.max. if not hit,
        // generate more productions. otherwise, it's fine.
        str = '';
        for (i = 0; i < token.max; i++) {
          let [s, c] = this._gen(token.value, groups, match);
          if (c === 0) {
            break;
          }
          str += s
          consumed += c
          match = match.slice(1);
        }

        if (i < token.min) {
          for (let o = 0; o < n - i; o++) {
            let [s, _] = this._gen(token.value, groups, match);
            str += s
          }
        }

        return [str, consumed];

      case types.REFERENCE:
        return [groups[token.value - 1] || '', 0];

      case types.CHAR:
        code = this.ignoreCase && this._randBool() ?
          this._toOtherCase(token.value) : token.value;
        if (match) {
          if (token.value === match.charCodeAt(0) || (this.ignoreCase && code === match.charCodeAt(0))) {
            consumed++;
          } else {
            let [s, c] = this._gen(token, groups, match.slice(1))
            if (c > 0) {
              return [s, c + 1];
            }
          }
        }
        return [String.fromCharCode(code), consumed];
    }
  }


  /**
   * If code is alphabetic, converts to other case.
   * If not alphabetic, returns back code.
   *
   * @param {number} code
   * @return {number}
   */
  _toOtherCase(code) {
    return code + (97 <= code && code <= 122 ? -32 :
      65 <= code && code <= 90  ?  32 : 0);
  }


  /**
   * Randomly returns a true or false value.
   *
   * @return {boolean}
   */
  _randBool() {
    return !this.randInt(0, 1);
  }


  /**
   * Randomly selects and returns a value from the array.
   *
   * @param {Array.<Object>} arr
   * @return {Object}
   * @return consumed
   */
  _randSelect(arr, groups, match) {
    if (arr instanceof DRange) {
      if (match) {
        const next = match.charCodeAt(0);
        if (arr.intersect(new DRange(next, next).length === 1)) {
          return [next, 1];
        }
        // If it doesn't intersect, should we delete and try the next one?
      }
      return [arr.index(this.randInt(0, arr.length - 1)), 0];
    }

    if (match) {
      let best = null;
      let bestI = 0;
      arr.forEach((opt, i) => {
        const result = this._gen({
          type: types.ROOT,
          stack: opt,
        }, groups, match)
        if (!best || best[1] < result[1]) {
          best = result;
          bestI = i;
        }
      });

      return [arr[bestI], best[1]];
    }

    return [arr[this.randInt(0, arr.length - 1)], 0];
  }


  /**
   * Expands a token to a DiscontinuousRange of characters which has a
   * length and an index function (for random selecting).
   *
   * @param {Object} token
   * @return {DiscontinuousRange}
   */
  _expand(token) {
    if (token.type === ret.types.CHAR) {
      return new DRange(token.value);
    } else if (token.type === ret.types.RANGE) {
      return new DRange(token.from, token.to);
    } else {
      let drange = new DRange();
      for (let i = 0; i < token.set.length; i++) {
        let subrange = this._expand(token.set[i]);
        drange.add(subrange);
        if (this.ignoreCase) {
          for (let j = 0; j < subrange.length; j++) {
            let code = subrange.index(j);
            let otherCaseCode = this._toOtherCase(code);
            if (code !== otherCaseCode) {
              drange.add(otherCaseCode);
            }
          }
        }
      }
      if (token.not) {
        return this.defaultRange.clone().subtract(drange);
      } else {
        return this.defaultRange.clone().intersect(drange);
      }
    }
  }


  /**
   * Randomly generates and returns a number between a and b (inclusive).
   *
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  randInt(a, b) {
    return a + Math.floor(Math.random() * (1 + b - a));
  }


  /**
   * Default range of characters to generate from.
   */
  get defaultRange() {
    return this._range = this._range || new DRange(32, 126);
  }

  set defaultRange(range) {
    this._range = range;
  }


  /**
   *
   * Enables use of randexp with a shorter call.
   *
   * @param {RegExp|string| regexp}
   * @param {string} m
   * @return {string}
   */
  static randexp(regexp, m) {
    let randexp;
    if(typeof regexp === 'string') {
      regexp = new RegExp(regexp, m);
    }

    if (regexp._randexp === undefined) {
      randexp = new RandExp(regexp, m);
      regexp._randexp = randexp;
    } else {
      randexp = regexp._randexp;
      randexp._setDefaults(regexp);
    }
    return randexp.gen();
  }


  /**
   * Enables sugary /regexp/.gen syntax.
   */
  static sugar() {
    /* eshint freeze:false */
    RegExp.prototype.gen = function() {
      return RandExp.randexp(this);
    };
  }
};
