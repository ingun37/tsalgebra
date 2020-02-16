import Sequence, {
  asSequence, range
} from 'sequency';
import { Exp, Scalar, Var, Mul, Add } from './expressions'
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

function commutativeMul(x: Exp, y: Exp): Exp {
  if (x instanceof Scalar) {
    if (y instanceof Scalar) {
      return x.mul(y)
    }
  }
  return null
}

export function mul(head: Exp, tail: Exp[]): Exp {
  if (tail.length == 0) {
    return head
  }
  let exps = [head].concat(tail)
  let len = exps.length
  let com = rng(len).flatMap(i => rng2(i + 1, len).map((j): [number, number] => [i, j]))
  let join = com.map((pair): [[number, number], Exp] => {
    let l = exps[pair[0]]
    let r = exps[pair[1]]
    return [pair, commutativeMul(l, r) || commutativeMul(r, l)]
  }).firstOrNull(x => x[1] != null)

  if (join) {
    let remains = rng(len).filter(x => x != join[0][0] && x != join[0][1]).map(i => exps[i])
    return mul(join[1], (remains.toArray()))
  } else {
    //TODO sequencial mul
    return tail.reduce((l, r) => new Mul(l, r), head)
  }
}

function seperateScalar(exps:Exp[]): [Scalar, Exp[]] {
  let scalar = exps.filter(x=>x instanceof Scalar).map(x=>x as Scalar).reduce((l,r)=>l.mul(r), new Scalar(1))
  return [scalar, exps.filter(x=>!(x instanceof Scalar))]
}

function add2(x:Exp, y:Exp): Exp {
  if (x instanceof Scalar) {
    if (x.isZero) {
      return y
    }
  }
  if (x instanceof Scalar && y instanceof Scalar) {
    return x.add(y)
  }
  let ad = decompose(x)
  let bd = decompose(y)
  if (ad.length == 1 && bd.length == 1) {
    let [as, ao] = seperateScalar(ad[0])
    let [bs, bo] = seperateScalar(bd[0])
    if (ao.length > 0 && ao.length == bo.length && rng(ao.length).all(x=>ao[x].eq(bo[x]))) {
      let sum = as.add(bs) as Exp
      return [sum].concat(ao).reduce((l,r)=>new Mul(l,r))
    }
  }
  return null
}

export function add(head: Exp, tail: Exp[]): Exp {
  if (tail.length == 0) {
    return head
  }
  let exps = [head].concat(tail)
  let len = exps.length
  let com = rng(len).flatMap(i => rng2(i + 1, len).map((j): [number, number] => [i, j]))
  let join = com.map((pair): [[number, number], Exp] => {
    let l = exps[pair[0]]
    let r = exps[pair[1]]
    return [pair, add2(l, r) || add2(r, l)]
  }).firstOrNull(x => x[1] != null)

  if (join) {
    let remains = rng(len).filter(x => x != join[0][0] && x != join[0][1]).map(i => exps[i])
    return add(join[1], (remains.toArray()))
  } else {
    return tail.reduce((l, r) => new Add(l, r), head)
  }
}

export function evaluate(e:Exp): Exp {
  let de = decompose(e)
  if (de.length == 1) {
    if (de[0].length == 1) {
      return de[0][0]
    }
  }
  let de2 = de.map(x=>x.map(y=>evaluate(y)))
  let toadd = de2.map(multiplands => {
    if (multiplands.length == 0) {
      return null
    } else {
      return mul(multiplands[0], multiplands.slice(1))
    }
  }).filter(x=>x)
  return add(toadd[0], toadd.slice(1))
}

function rng(n: number): Sequence<number> {
  if (n == 1) {
    return asSequence([0])
  } else if (n == 0) {
    return asSequence([])
  }
  return range(0, n - 1, 1)
}

function rng2(start: number, lessThan: number): Sequence<number> {
  if (start == lessThan - 1) {
    return asSequence([start])
  } else if (start == lessThan) {
    return asSequence([])
  }
  return range(start, lessThan - 1, 1)
}
export function xshow(e:Exp):string {
  if (e instanceof Add) {
    return  "add(" + xshow(e.l) + ", " + xshow(e.r) + ")"
  } else if (e instanceof Mul) {
    return  "mul(" + xshow(e.l) + ", " + xshow(e.r) + ")"
  } else if (e instanceof Var) {
    return e.name
  } else if (e instanceof Scalar) {
    return e.n.toString()
  }
  return `${e}`
}