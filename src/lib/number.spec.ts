// tslint:disable:no-expression-statement
import test from 'ava';
import {  decompose, mul, add, evaluate, isomorphic, xshow } from './number';
import { Scalar, Var, Exp, Mul, Add, Power, Negate, Mat,} from './expressions';
import { Rational } from './rational';


function xsca(n: number): Scalar { return new Scalar(n) }
function xvar(l: string): Var { return new Var(l) }
function xpow(a:Exp, n:number): Power {return new Power(a, xsca(n))}
let x = xvar("x")
let y = xvar("y")
let n1 = xsca(1)
let n2 = xsca(2)
let n3 = xsca(3)

function xmul(a:Exp, b:Exp): Mul {
  return new Mul(a, b)
}
function xadd(a:Exp, b:Exp): Add {
  return new Add(a, b)
}
test('decompose', t => {
  t.is(true, true)
  let ex = [
    [ x, y ],
    [ x, n1 ],
    [ n1, y ],
    [ n1, n1 ]
  ]
  t.deepEqual(decompose(xmul(xadd(x, n1), xadd(y, n1))), ex)
})

test('mul', t => {
  let x = xmul(xsca(6),y)
  t.deepEqual(mul(n3, [n1, y, n2]), x)
})


test('add', t => {
  let v = add(n1, [x, n2, y, n3])
  let e = xadd(xadd(xsca(6), x),y)
  t.true(isomorphic(v,(e)))
})

test('eval', t => {
  let v = evaluate( xmul(xadd(x, xadd(y, n1)), xadd(y, n2)))
  // console.log(xshow(v))
  let e = xadd(xadd(xadd(xadd(xmul(n3, y), xmul(x, y)), xmul(x, n2)), xpow(y, 2)), n2)
  t.true(isomorphic(v,(e)))
})

test('pow decompose', t => {
  let v = evaluate( xpow(xadd(x, n1), 2))
  // console.log(xshow(v))
  let e = xadd(xadd(xmul(n2, x), xpow(x, 2)), n1)
  t.true(isomorphic(v,(e)))
})

test('eq tests', t => {
  t.true(isomorphic(n1,(xsca(1))))
  t.true(isomorphic(new Scalar(new Rational(1, 2)),(new Scalar(new Rational(2,4)))))
  // t.true(arriso([n1, n2], [n1, n2]))
  // t.true(injective([[n1]], [[n1]]))
})

test('add iso', t=>{
  let x = xadd(n1, xadd(n2, n3))
  let y = xadd(n3, xadd(n1, n2))
  t.true(isomorphic(x,(y)))
})


test('neg test', t=>{
  let x = xvar("x")
  let n1 = xsca(1)
  let v = evaluate(xmul(xadd(x, new Negate(n1)), xadd(x, n1)))

  // console.log(xshow(v))
  t.true(isomorphic(v, xadd(xpow(x, 2), xsca(-1)) ))
})

function xmat(e:number[][]):Mat {
  let a = e.map(r=>r.map(c=>xsca(c) as Exp))
  return new Mat(a)
}

test('mat mul test', t=>{
  let i = xmat([[1,0],[0,1]])
  let v = evaluate(xmul(i, i))

  console.log(xshow(i))
  // t.true(true)
  t.true(isomorphic(v, i))
})