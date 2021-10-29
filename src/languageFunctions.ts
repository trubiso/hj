import prompt from "prompt-sync";
import Fraction from "./dataclasses/fraction";
import ArrayClass from "./dataclasses/array"
import Evaluator, { IVar } from "./evaluator";
import { getNodeTypeName, IFunctionCallNode, ISymbolNode, IValueNode, NodeType } from "./parser/nodes";
import { TokenTypes } from "./token";
import ExpressionEvaluator from "./expressionEvaluator";

export const standardFunctions: any = {
    print: (...v: IValueNode[]) => {
        console.log(...v.map(r => r.value).map(r => (r instanceof Fraction || r instanceof ArrayClass) ? r.toString() : r))
    },
    stringify: (...v: IValueNode[]) => v.map(y => y.value.toString()).join(' '),
    sqrt: (v: IValueNode) => Math.sqrt(v.value),
    input: (v: IValueNode) => {
        const s = prompt({ sigint: true } as prompt.Config)(v.value)
        if (s.trim().match(TokenTypes.FRACTION) === null) {
            if (s.includes('.') && parseFloat(s)) return parseFloat(s);
            if (parseInt(s)) return parseInt(s);
            return s;
        }
        const p = s.split('/').map(v => parseInt(v));
        return new Fraction(p[0], p[1]);
    },
    range: (v: IValueNode) => new ArrayClass(...[...new Array(v.value).keys()].map(y => {
        return { type: NodeType.NumberLiteral, value: y } as IValueNode
    }))
};

export const dotProps = (accessee: IValueNode, property: ISymbolNode): IValueNode => {
    switch(accessee.type) {
    case NodeType.Array:
        break;
    default:
        throw 'Invalid accessee type! (Only arrays are available for now)';
    }

    for (const [key, value] of Object.entries(accessee.value)) {
        if (key === property.name && typeof value !== 'function') {
            return {
                type: Evaluator.getType(value),
                value: value
            } as IValueNode;
        }
    }
    throw `This property (${property.name}) does not exist on ${accessee.value.name}!`;
}

export const dotFunctions = (accessee: IValueNode, func: IFunctionCallNode, evaluator: Evaluator) => {
    switch(accessee.type) {
    case NodeType.Array:
        break;
    default:
        throw 'Invalid accessee type! (Only arrays are available for now)';
    }

    for (const [key, value] of Object.entries(accessee.value)) {
        if (key === func.name && typeof value === 'function') {
            const parsedArgs = func.args.args.map(v => evaluator.evaluateExpression(v));
            const result = value(...parsedArgs);
            return {
                type: Evaluator.getType(result),
                value: result
            } as IValueNode;
        }
    }
    throw `This function (${func.name}) does not exist on ${accessee.value}!`;
}
/*    array: {
        has: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            return {
                type: NodeType.Boolean,
                value: e.variables.find(v => v.name === s.name)?.val.has(i[0])
            };
        }) as DotFunction,
        /*pop: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
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
        last: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
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
        }) as DotFunction,*//*
        append: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            i.forEach(y => e.variables.find(v => v.name === s.name)?.val.append(y));
            return {
                type: NodeType.NumberLiteral,
                value: e.variables.find(v => v.name === s.name)?.val.length
            };
        }) as DotFunction,
        prepend: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            i.forEach(y => e.variables.find(v => v.name === s.name)?.val.prepend(y));
            return {
                type: NodeType.NumberLiteral,
                value: e.variables.find(v => v.name === s.name)?.val.length
            };
        }) as DotFunction,
        /*reverse: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            return {
                type: NodeType.Array,
                value: e.variables.find(v => v.name === s.name)?.val.reverse()
            };
        }) as DotFunction,
        shift: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
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
        first: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
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
        unique: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
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
        // for trubiso later: leave that out for no, gonna be complicated
        shuffle: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
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
        pick: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            const v = arr[Math.floor(Math.random() * arr.length)];
            return {
                type: Evaluator.getType(v),
                value: v
            };
        }) as DotFunction,
        fill: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
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
        insert: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            e.variables.find(v => v.name === s.name)!.val = [...arr.slice(0, i[1]), i[0], ...arr.slice(i[1])];

            return {
                type: NodeType.Boolean,
                value: arr.length + 1
            };
        }) as DotFunction,
        delete: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            e.variables.find(v => v.name === s.name)?.val.splice(i[0], i[1]);
            return {
                type: NodeType.Boolean,
                value: e.variables.find(v => v.name === s.name)?.val.length
            };
        }) as DotFunction,
        h: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            return {
                type: NodeType.Array,
                value: dotFunctions['array'].fill(e, s, "h").value
            };
        }) as DotFunction,
        j: ((e: Evaluator, s: ISymbolNode, ...i: IValueNode[]): IValueNode => {
            return {
                type: NodeType.Array,
                value: dotFunctions['array'].fill(e, s, "j").value
            };
        }) as DotFunction*//*
    }
}
}*/