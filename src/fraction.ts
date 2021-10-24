export const gcd = (a: number, b: number): number => a?gcd(b%a,a):b;
export const lcm = (a: number, b: number): number => a*b/gcd(a,b);


export default class Fraction {
    private n: number;
    private d: number;

    public get num() { return this.n; }
    public get den() { return this.d; }

    public set num(val: number) { this.n = val; this.simplifySelf(); }
    public set den(val: number) { this.d = val; this.simplifySelf(); }

    constructor(num: number, den: number) { this.n = num; this.d = den; }

    public invert() { return new Fraction(this.d, this.n); }
    public toString() { return `${this.n}/${this.d}`; }

    public simplify() { const g = gcd(this.n, this.d); return new Fraction(this.n/g, this.d/g); }
    public simplifySelf() { this.n = this.simplify().n; this.d = this.simplify().d; }

    static commonDenominator(...fracs: Fraction[]) {
        const simplifiedFracs = fracs.map(v => v.simplify());
        const d = simplifiedFracs.map(v => v.d).reduce(lcm);
        return simplifiedFracs.map(v => new Fraction(d/v.d * v.n, d));
    }

    static add(...fracs: Fraction[]) { return Fraction.commonDenominator(...fracs).reduce((a, b) => new Fraction(a.n + b.n, a.d)).simplify(); }
    static subtract(...fracs: Fraction[]) { return Fraction.commonDenominator(...fracs).reduce((a, b) => new Fraction(a.n - b.n, a.d)).simplify(); }
    static multiply(...fracs: Fraction[]) { return fracs.reduce((a, b) => new Fraction(a.n * b.n, a.d * b.d)).simplify(); }
    static divide(...fracs: Fraction[]) { return fracs.reduce((a, b) => new Fraction(a.n * b.d, a.d * b.n)).simplify(); }

    public add(...fracs: Fraction[]) { return Fraction.add(this, ...fracs); }
    public subtract(...fracs: Fraction[]) { return Fraction.subtract(this, ...fracs); }
    public multiply(...fracs: Fraction[]) { return Fraction.multiply(this, ...fracs); }
    public divide(...fracs: Fraction[]) { return Fraction.divide(this, ...fracs); }
}