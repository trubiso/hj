import { IValueNode, NodeType } from "../parser";
import IDataClass from "./dataClass";

export const gcd = (a: number, b: number): number => a?gcd(b%a,a):b;
export const lcm = (a: number, b: number): number => a*b/gcd(a,b);


export default class Fraction implements IDataClass{
    private n: number;
    private d: number;

    public get num() { return this.n; }
    public get den() { return this.d; }

    public set num(val: number) { this.n = val; this.simplifySelf(); }
    public set den(val: number) { this.d = val; this.simplifySelf(); }

    constructor(num: number, den: number) { this.n = num; this.d = den; }
    static fromNumber(n: number) { return new Fraction(n, 1); }

    public invert() { return new Fraction(this.d, this.n); }
    public toString() { return this.d === 1 ? this.n.toString() : `${this.n}/${this.d}`; }

    public simplify() { const g = gcd(this.n, this.d); return new Fraction(this.n/g, this.d/g); }
    public simplifySelf() { this.n = this.simplify().n; this.d = this.simplify().d; }

    static commonDenominator(...fracs: Fraction[]) {
        const simplifiedFracs = fracs.map(v => v.simplify());
        const d = simplifiedFracs.map(v => v.d).reduce(lcm);
        return simplifiedFracs.map(v => new Fraction(d/v.d * v.n, d));
    }

    static addMultiple(...fracs: Fraction[]) { return Fraction.commonDenominator(...fracs).reduce((a, b) => new Fraction(a.n + b.n, a.d)).simplify(); }
    static subtractMultiple(...fracs: Fraction[]) { return Fraction.commonDenominator(...fracs).reduce((a, b) => new Fraction(a.n - b.n, a.d)).simplify(); }
    static multiplyMultiple(...fracs: Fraction[]) { return fracs.reduce((a, b) => new Fraction(a.n * b.n, a.d * b.d)).simplify(); }
    static divideMultiple(...fracs: Fraction[]) { return fracs.reduce((a, b) => new Fraction(a.n * b.d, a.d * b.n)).simplify(); }

    public addSelf(...fracs: Fraction[]) { return Fraction.addMultiple(this, ...fracs); }
    public subtractSelf(...fracs: Fraction[]) { return Fraction.subtractMultiple(this, ...fracs); }
    public multiplySelf(...fracs: Fraction[]) { return Fraction.multiplyMultiple(this, ...fracs); }
    public divideSelf(...fracs: Fraction[]) { return Fraction.divideMultiple(this, ...fracs); }

    public add(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        return {
            type: NodeType.Fraction,
            value: frac1.value.addSelf(frac2.value)
        } as IValueNode
    }
    public subtract(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        return {
            type: NodeType.Fraction,
            value: frac1.value.subtractSelf(frac2.value)
        } as IValueNode
    }
    public multiply(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        return {
            type: NodeType.Fraction,
            value: frac1.value.multiplySelf(frac2.value)
        } as IValueNode
    }
    public divide(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        return {
            type: NodeType.Fraction,
            value: frac1.value.divideSelf(frac2.value)
        } as IValueNode
    }
    public pow(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        throw 'Unsupported operator for two fractions: \'**\''
    }
}