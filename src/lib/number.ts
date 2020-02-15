import Sequence, {
  asSequence
} from 'sequency';
import { Rational } from './rational';

/**
 * Multiplies a value by 2. (Also a full example of Typedoc's functionality.)
 *
 * ### Example (es module)
 * ```js
 * import { double } from 'typescript-starter'
 * console.log(double(4))
 * // => 8
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var double = require('typescript-starter').double;
 * console.log(double(4))
 * // => 8
 * ```
 *
 * @param value   Comment describing the `value` parameter.
 * @returns       Comment describing the return type.
 * @anotherNote   Some other value.
 */
export function double(value: number): number {
  return value * 2;
}

/**
 * Raise the value of the first parameter to the power of the second using the es7 `**` operator.
 *
 * ### Example (es module)
 * ```js
 * import { power } from 'typescript-starter'
 * console.log(power(2,3))
 * // => 8
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var power = require('typescript-starter').power;
 * console.log(power(2,3))
 * // => 8
 * ```
 */
export function power(base: number, exponent: number): number {

  // This is a proposed es7 operator, which should be transpiled by Typescript
  return base ** exponent;
}
export interface Exp {
  eq(e: Exp): boolean
}
interface Nullary extends Exp { }

function isRational(n: number | Rational): n is Rational {
  return (n as Rational).add !== undefined;
}
// function isNumber(n: number | Rational): n is number {
//   return !isRational(n)
// }
export class Scalar implements Nullary {
  eq(e: Exp): boolean {
    return e instanceof Scalar && e.n == this.n
  }

  n: number | Rational
  constructor(
    n: number | Rational
  ) {
    this.n = n
    if (n instanceof Rational) {
      if (n.numerator == 0) {
        this.n = 0
      } else if (n.denominator == 1) {
        this.n = n.numerator
      } else if (Math.abs(n.numerator) == Math.abs(n.denominator)) {
        this.n = n.numerator / n.numerator
      }
    }
  }
  add(s: Scalar): Scalar {
    let n = this.n
    let m = s.n
    if (isRational(n)) {
      if (isRational(m)) {
        return new Scalar(n.add(m))
      } else {
        if (Number.isInteger(m)) {
          return new Scalar(n.add(new Rational(m, 1)))
        } else {
          return new Scalar((n.numerator / n.denominator) + m)
        }
      }
    } else {
      if (isRational(m)) {
        return s.add(this)
      } else {
        return new Scalar(n + m)
      }
    }
  }
  mul(s: Scalar): Scalar {
    let n = this.n
    let m = s.n
    if (isRational(n)) {
      if (isRational(m)) {
        return new Scalar(n.mul(m))
      } else {
        if (Number.isInteger(m)) {
          return new Scalar(n.mul(new Rational(m, 1)))
        } else {
          return new Scalar((n.numerator / n.denominator) * m)
        }
      }
    } else {
      if (isRational(m)) {
        return s.mul(this)
      } else {
        return new Scalar(n * m)
      }
    }
  }
  get inverse(): Scalar {
    let n = this.n
    if (isRational(n)) {
      return new Scalar(new Rational(n.denominator, n.numerator))
    } else {
      if (Number.isInteger(n)) {
        return new Scalar(new Rational(1, n))
      } else {
        return new Scalar(1 / n)
      }
    }
  }
  get isZero(): boolean {
    let n = this.n
    if (isRational(n)) {
      return n.numerator == 0
    } else {
      return n == 0
    }
  }
}

export class Var implements Nullary {
  eq(e: Exp): boolean {
    return e instanceof Var && e.name == this.name
  }
  constructor(
    public name: string
  ) { }
}

export class Add implements Exp {
  eq(e: Exp): boolean {
    return e instanceof Add && e.l.eq(this.l) && e.r.eq(this.r)
  }
  constructor(
    public l: Exp,
    public r: Exp
  ) { }
}

export class Mul implements Exp {
  eq(e: Exp): boolean {
    return e instanceof Mul && e.l.eq(this.l) && e.r.eq(this.r)
  }
  constructor(
    public l: Exp,
    public r: Exp
  ) { }
}

export function decompose(e: Exp): Exp[][] {
  if (e instanceof Scalar) { return [[e]] }
  if (e instanceof Var) { return [[e]] }
  if (e instanceof Mul) {
    let ld = decompose(e.l)
    let rd = decompose(e.r)
    let rs = seq(ld).flatMap(x => seq(rd).map(y => x.concat(y)))
    return rs.toArray()
  }
  if (e instanceof Add) {
    return decompose(e.l).concat(decompose(e.r))
  }
  throw e
}

function seq<T>(x: T[]): Sequence<T> {
  return asSequence(x)
}

