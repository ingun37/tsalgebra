import { Rational } from "./rational";

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
        if (e instanceof Scalar) {
            if (isRational(this.n)) {
                if (isRational(e.n)) {
                    return e.n.numerator == this.n.numerator && e.n.denominator == this.n.denominator
                }
            }
        }
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

    
    get swapped(): Add {
        return new Add(this.r, this.l)
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

export class Power implements Exp {

    constructor(
        public base: Exp,
        public exponent: Exp
    ) { }
    eq(e: Exp): boolean {
        return e instanceof Power && e.base.eq(this.base) && e.exponent.eq(this.exponent)
    }
}

