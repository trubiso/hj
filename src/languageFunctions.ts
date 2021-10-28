import prompt from "prompt-sync";
import Fraction from "./dataclasses/fraction";
import Evaluator, { IVar } from "./evaluator";
import { ISymbolNode, IValueNode, NodeType } from "./parser/nodes";
import { TokenTypes } from "./token";

export const standardFunctions: any = {
    print: (...v: any[]) => {
        console.log(...v.map(r => r instanceof Fraction ? r.toString() : r))
    },
    stringify: (...v: any[]) => v.map((y: any) => y.toString()).join(' '),
    sqrt: Math.sqrt,
    input: (v: string) => {
        const s = prompt({ sigint: true } as prompt.Config)(v)
        if (s.trim().match(TokenTypes.FRACTION) === null) {
            if (s.includes('.') && parseFloat(s)) return parseFloat(s);
            if (parseInt(s)) return parseInt(s);
            return s;
        }
        const p = s.split('/').map(v => parseInt(v));
        return new Fraction(p[0], p[1]);
    }
};

type DotFunction = (e: Evaluator, s: ISymbolNode, ...i: any[]) => IValueNode;
type DotProp = (e: Evaluator, s: ISymbolNode, ...i: any[]) => IValueNode;

export const dotProps: any = {
    array: {
        length: ((e: Evaluator, s: ISymbolNode): IValueNode => {
            return {
                type: NodeType.NumberLiteral,
                value: e.variables.find(v => v.name === s.name)?.val.length
            };
        }) as DotProp
    }
}

export const dotFunctions: any = {
    array: {
        has: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.Boolean,
                value: e.variables.find(v => v.name === s.name)?.val.includes(i[0])
            };
        }) as DotFunction,
        join: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.StringLiteral,
                value: e.variables.find(v => v.name === s.name)?.val.join(i[0])
            };
        }) as DotFunction,
        pop: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            if (i[0] && i[0] !== 1) {
                const v = e.variables.find(v => v.name === s.name)?.val.splice(arr.length - i[0], i[0]);
                return {
                    type: Evaluator.getType(v),
                    value: v
                };
            } else {
                const v = e.variables.find(v => v.name === s.name)?.val.pop()
                return {
                    type: Evaluator.getType(v),
                    value: v
                };
            }
        }) as DotFunction,
        last: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            if (i[0] && i[0] !== 1) {
                const v = arr.slice(-i[0]);
                return {
                    type: Evaluator.getType(v),
                    value: v
                };
            } else {
                const v = arr[arr.length - 1]
                return {
                    type: Evaluator.getType(v),
                    value: v
                };
            }
        }) as DotFunction,
        append: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.NumberLiteral,
                value: e.variables.find(v => v.name === s.name)?.val.push(...i)
            };
        }) as DotFunction,
        prepend: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.NumberLiteral,
                value: e.variables.find(v => v.name === s.name)?.val.unshift(...i)
            };
        }) as DotFunction,
        reverse: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.Array,
                value: e.variables.find(v => v.name === s.name)?.val.reverse()
            };
        }) as DotFunction,
        shift: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            if (i[0] && i[0] !== 1) {
                const v = e.variables.find(v => v.name === s.name)?.val.splice(0, i[0]);
                return {
                    type: Evaluator.getType(v),
                    value: v
                };
            } else {
                const v = e.variables.find(v => v.name === s.name)?.val.shift()
                return {
                    type: Evaluator.getType(v),
                    value: v
                };
            }
        }) as DotFunction,
        first: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            if (i[0] && i[0] !== 1) {
                const v = arr.slice(0, i[0]);
                return {
                    type: Evaluator.getType(v),
                    value: v
                };
            } else {
                const v = arr[0]
                return {
                    type: Evaluator.getType(v),
                    value: v
                };
            }
        }) as DotFunction,
        unique: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            const arrIdx = e.variables.findIndex(v => v.name === s.name);
            const unique: any[] = [];
            arr.forEach(x => {if (!unique.includes(x)) unique.push(x)});
            e.variables[arrIdx].val = unique;
            return {
                type: NodeType.Array,
                value: unique
            };
        }) as DotFunction,
        shuffle: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            const arrIdx = e.variables.findIndex(v => v.name === s.name);

            // shuffle
            const unshuffled = [...arr]; // make sure its not a reference
            const shuffled = [];
            while (shuffled.length !== arr.length) {
                const index = Math.floor(Math.random() * unshuffled.length);
                shuffled.push(unshuffled[index]);
                unshuffled.splice(index, 1);
            }

            e.variables[arrIdx].val = shuffled;
            return {
                type: NodeType.Array,
                value: shuffled
            };
        }) as DotFunction,
        pick: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            const v = arr[Math.floor(Math.random() * arr.length)];
            return {
                type: Evaluator.getType(v),
                value: v
            };
        }) as DotFunction,
        fill: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            const arrIdx = e.variables.findIndex(v => v.name === s.name);
            
            const lim = i[1] ? i[1] : arr.length;
            let filled: any[] = new Array(lim);
            filled.fill('', 0, lim);
            filled = filled.map(_ => i[0]);

            e.variables[arrIdx].val = filled;
            return {
                type: NodeType.Array,
                value: filled
            };
        }) as DotFunction,
        insert: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            e.variables.find(v => v.name === s.name)!.val = [...arr.slice(0, i[1]), i[0], ...arr.slice(i[1])];

            return {
                type: NodeType.Boolean,
                value: arr.length + 1
            };
        }) as DotFunction,
        delete: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            e.variables.find(v => v.name === s.name)?.val.splice(i[0], i[1]);
            return {
                type: NodeType.Boolean,
                value: e.variables.find(v => v.name === s.name)?.val.length
            };
        }) as DotFunction,
        h: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.Array,
                value: dotFunctions['array'].fill(e, s, "h").value
            };
        }) as DotFunction,
        j: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.Array,
                value: dotFunctions['array'].fill(e, s, "j").value
            };
        }) as DotFunction
    }
}