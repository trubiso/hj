import { IValueNode, NodeType } from "../parser/nodes";
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

    static add(...fracs: Fraction[]) { return Fraction.commonDenominator(...fracs).reduce((a, b) => new Fraction(a.n + b.n, a.d)).simplify(); }
    static subtract(...fracs: Fraction[]) { return Fraction.commonDenominator(...fracs).reduce((a, b) => new Fraction(a.n - b.n, a.d)).simplify(); }
    static multiply(...fracs: Fraction[]) { return fracs.reduce((a, b) => new Fraction(a.n * b.n, a.d * b.d)).simplify(); }
    static divide(...fracs: Fraction[]) { return fracs.reduce((a, b) => new Fraction(a.n * b.d, a.d * b.n)).simplify(); }

    public add(...fracs: Fraction[]) { return Fraction.add(this, ...fracs); }
    public subtract(...fracs: Fraction[]) { return Fraction.subtract(this, ...fracs); }
    public multiply(...fracs: Fraction[]) { return Fraction.multiply(this, ...fracs); }
    public divide(...fracs: Fraction[]) { return Fraction.divide(this, ...fracs); }

    public _add(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        return {
            type: NodeType.Fraction,
            value: frac1.value.addSelf(frac2.value)
        } as IValueNode
    }
    public _subtract(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        return {
            type: NodeType.Fraction,
            value: frac1.value.subtractSelf(frac2.value)
        } as IValueNode
    }
    public _multiply(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        return {
            type: NodeType.Fraction,
            value: frac1.value.multiplySelf(frac2.value)
        } as IValueNode
    }
    public _divide(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        return {
            type: NodeType.Fraction,
            value: frac1.value.divideSelf(frac2.value)
        } as IValueNode
    }
    public _pow(frac1: IValueNode, frac2: IValueNode): IValueNode { 
        throw 'Unsupported operator for two fractions: \'**\''
    }
    public _equals(frac1: IValueNode, frac2: IValueNode): IValueNode {
        const sf: Fraction[] = [frac1, frac2].map(v => v.value.simplify());
        return {
            type: NodeType.Boolean,
            value: sf[0].n === sf[1].n && sf[0].d === sf[1].d
        } as IValueNode;
    }
    public _equalsNot(frac1: IValueNode, frac2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this._equals(frac1, frac2).value
        } as IValueNode;
    }
    public _greater(frac1: IValueNode, frac2: IValueNode): IValueNode {
        const cd = Fraction.commonDenominator(frac1.value, frac2.value);
        return {
            type: NodeType.Boolean,
            value: cd[0].n > cd[1].n
        } as IValueNode;
    }
    public _greaterEqual(frac1: IValueNode, frac2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this._smaller(frac1, frac2).value
        } as IValueNode;
    }
    public _smaller(frac1: IValueNode, frac2: IValueNode): IValueNode {
        const cd = Fraction.commonDenominator(frac1.value, frac2.value);
        return {
            type: NodeType.Boolean,
            value: cd[0].n < cd[1].n
        } as IValueNode;
    }
    public _smallerEqual(frac1: IValueNode, frac2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this._greater(frac1, frac2).value
        } as IValueNode;
    }
}