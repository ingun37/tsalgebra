import Sequence, {
  asSequence, range
} from 'sequency';
import { Exp, Scalar, Var, Mul, Add, Power, Negate } from './expressions'
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

function isRational(n: number | Rational): n is Rational {
  return (n as Rational).add !== undefined;
}
function isNumber(n: number | Rational): n is number {
  return !isRational(n)
}

export function decompose(e: Exp): Exp[][] {
  if (e instanceof Scalar) { return [[e]] }
  if (e instanceof Var) { return [[e]] }
  if (e instanceof Negate) {
    let d = decompose(e.e)
    let neg:Exp = new Scalar(-1)
    return d.map(x=>[neg].concat(x))
  }
  if (e instanceof Power) {
    let x = e.exponent
    let b = e.base
    let bd = decompose(b)
    if (x instanceof Scalar) {
      let n = x.n
      if (isNumber(n)) {
        if (Number.isInteger(n)) {
          if (n == 0) {
            return [[new Scalar(1)]]
          } else if (n == 1) {
            return bd
          } else if (n >0) {
            return decompose( rng(n).map(_=>b).reduce((l,r)=>new Mul(l,r)) )
          }
        }
      }
    }
    if (bd.length == 1) {
      if (bd[0].length > 0) {
        let aa = bd[0].map(z=> new Power(z,x) as Exp)
        return [aa]
      }
    }
  }
  if (e instanceof Mul) {
    let ld = decompose(e.l)
    let rd = decompose(e.r)
    let rs = seq(ld).flatMap(x => seq(rd).map(y => x.concat(y)))
    return rs.toArray()
  }
  if (e instanceof Add) {
    return decompose(e.l).concat(decompose(e.r))
  }
  return [[e]]
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
  if (x instanceof Scalar && x.isZero) {
    return new Scalar(0)
  }
  return null
}
function adjacentCommuteMul(x: Exp, y: Exp): Exp {
  if (x instanceof Power && y instanceof Power) {
    if (isomorphic( x.base,(y.base))) {
      return new Power(x.base, add(x.exponent, [y.exponent]))
    }
  }
  if (x instanceof Power && isomorphic(x.base,(y))) {
    return new Power(x.base, add(x.exponent, [new Scalar(1)]))
  }
  if (isomorphic(x,(y))) {
    return new Power(x, new Scalar(2))
  }
  return null
}
export function mul(head: Exp, tail: Exp[]): Exp {
  if (tail.length == 0) {
    return head
  }
  let exps = [head].concat(tail)
  let join = withRest(exps).flatMap(([x,xs])=>withRest(xs.toArray()).map(([y,ys]):[Exp, Exp[]]=>{
    return [commutativeMul(x,y), ys.toArray()]
  })).firstOrNull(x=>x[0] != null)
  
  if (join) {
    return mul(join[0], join[1])
  }
  
  let join2 = rng(exps.length-1).map((n):[number, Exp]=>{
    let l = exps[n]
    let r = exps[n+1]
    return [n, adjacentCommuteMul(l,r) || adjacentCommuteMul(r,l)]
  }).firstOrNull(([_,e])=>e != null)

  if (join2) {
    let i = join2[0]
    let e = join2[1]
    let remains = exps.slice(0, i).concat([e], exps.slice(i+2))
    return  mul(remains[0], remains.slice(1))
  }

  return tail.reduce((l, r) => new Mul(l, r), head)
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
    if (arriso(ao, bo)) {
      let sum = as.add(bs)
      if (sum.isZero) {
        return new Scalar(0)
      }
      return [sum as Exp].concat(ao).reduce((l,r)=>new Mul(l,r))
    }
  }
  return null
}

export function add(head: Exp, tail: Exp[]): Exp {
  if (tail.length == 0) {
    return head
  }
  let exps = [head].concat(tail)
  let join = withRest(exps).flatMap(([x,xs])=>withRest(xs.toArray()).map(([y,ys]):[Exp, Exp[]]=>{
    return [add2(x,y), ys.toArray()]
  })).firstOrNull(x=>x[0] != null)
  
  if (join) {
    return add(join[0], join[1])
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

// function rng2(start: number, lessThan: number): Sequence<number> {
//   if (start == lessThan - 1) {
//     return asSequence([start])
//   } else if (start == lessThan) {
//     return asSequence([])
//   }
//   return range(start, lessThan - 1, 1)
// }
export function xshow(e:Exp):string {
  if (e instanceof Add) {
    return  "add(" + xshow(e.l) + ", " + xshow(e.r) + ")"
  } else if (e instanceof Mul) {
    return  "mul(" + xshow(e.l) + ", " + xshow(e.r) + ")"
  } else if (e instanceof Var) {
    return e.name
  } else if (e instanceof Scalar) {
    return e.n.toString()
  } else if (e instanceof Power) {
    return "pow(" + xshow(e.base) + ", " + xshow(e.exponent) + ")"
  }
  return `${e}`
}

function withRest<T>(s: T[]): Sequence<[T, Sequence<T>]> {
  return seq(s).withIndex().map(x => {
      return [x.value, seq(s).filterIndexed((i, _) => i != x.index)]
  })
}

export function isomorphic(x:Exp, y:Exp) {
  if (x.eq(y)) { return true }
  let a = decompose(x)
  let b = decompose(y)
  return injective(a, b) && injective(b, a)
}
function arriso(x: Exp[], y: Exp[]): boolean {
  return x.length == y.length && seq(x).zip(seq(y)).all(([a, b]) => a.eq(b))
}
function injective(xset: Exp[][], yset: Exp[][]): boolean {
  if (xset.length == 0) {return true}
  if (yset.length == 0) {return false}
  return withRest(xset).any(([x, xrest]) => {
      return withRest(yset).any(([y, yrest]) => {
          return arriso(x, y) && injective(xrest.toArray(), yrest.toArray())
      })
  })
}