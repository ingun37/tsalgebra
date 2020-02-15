// tslint:disable:no-expression-statement
import test from 'ava';
import { double, power, Scalar, Var, decompose, Exp, Mul, Add } from './number';

test('double', t => {
  t.is(double(2), 4);
});

test('power', t => {
  t.is(power(2, 4), 16);
});

function xsca(n: number): Scalar { return new Scalar(n) }
function xvar(l: string): Var { return new Var(l) }

let x = xvar("x")
let y = xvar("y")
let n1 = xsca(1)
function xmul(a:Exp, b:Exp): Mul {
  return new Mul(a, b)
}
function xadd(a:Exp, b:Exp): Add {
  return new Add(a, b)
}
test('decompose', t => {
  console.log(decompose(xmul(xadd(x, n1), xadd(y, n1))))
  t.is(true, true)
})
