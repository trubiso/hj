import chalk from "chalk";
import prompt from "prompt-sync";
import { INode, ITopNode, IVardecNode, ISymbolNode, NodeType, IExpressionNode, IValueNode, IOperatorNode, IFunctionCallNode } from "./parser";
import { BuiltIn } from "./token";

export interface IVar {
    name: string,
    val: any,
    type: BuiltIn
}

export interface IDummy<T> { // this interface sucks
    d: T
};

export type ExprType = (INode | IVar | ExprType)[]

export const standardFunctions: any = {
    print: console.log,
    toString: (v: any) => v.toString(),
    sqrt: Math.sqrt,
    input: (v: string) => prompt({ sigint: true } as prompt.Config)(v).toString()
};

export default class Evaluator {
    private ast: ITopNode;
    private variables: IVar[];

    constructor(ast: ITopNode) {
        this.ast = ast;
        this.variables = [];
    }

    private parseSymbol(s: ISymbolNode) : IVar {
        const r = this.variables.find(y => y.name === s.name);
        if (!r) {
            console.log(chalk.redBright(`symbol ${s.name} not found `) + chalk.grey(`(current symbols: ${this.variables.map(v => v.name).join(', ')})`));
            throw "";
        }
        if (r.type === 'string') r.val = r.val.slice(1, -1);
        return r;
    }

    private nodesToLiterals(n : INode[]) : any[] {
        return n.map(v => {
            switch(v.type) {
            case NodeType.UnparsedSymbol:
            case NodeType.Symbol:
                return this.parseSymbol(v as ISymbolNode).val;
            case NodeType.StringLiteral:
                return (v as IValueNode).value.slice(1, -1);
            case NodeType.NumberLiteral:
                return (v as IValueNode).value;
            case NodeType.Expression:
                return this.parseExpression(v as IExpressionNode);
            case NodeType.UnparsedOperator:
                return (v as IOperatorNode).operator;
            default:
                return null;
            }
        }).filter(v => v);
    }

    private parseExpression(n : IExpressionNode) : any {
        // Parse symbols into IVars
        const p = (v: INode | IVar) : any => { // this name is VERY descriptive. what does this function do? it p
            if (v.type === NodeType.UnparsedSymbol) {
                return this.parseSymbol(v as ISymbolNode);
            } else if (v.type === NodeType.Expression) {
                return (v as IExpressionNode).expr.map(p);
            } else if (v.type === NodeType.FunctionCall) {
                const t = this.evaluateFunctionCall(v as IFunctionCallNode);
                return {type: typeof t === "string" ? NodeType.StringLiteral : (typeof t === "number" ? NodeType.NumberLiteral : NodeType.Symbol), value: typeof t === "string" ? `"${t}"` : t} as IValueNode;
            } else {
                return v;
            }
        }
        
        const expr : ExprType[] = n.expr.map(p);

        // Convert into mathematical expression
        let exprStr = "";
        const r = (v: any) : void => { // yet another descriptive name
            if (v.length) {
                exprStr += "(";
                v.forEach(r);
                exprStr += ")";
                return; // i like this code
            }
            if (v.type !== NodeType.UnparsedOperator) {
                if (typeof v.type === "string") {
                    exprStr += `(${(v as IVar).val})`;
                } else {
                    exprStr += `(${(v as IValueNode).value})`;
                }
            } else {
                exprStr += (v as IOperatorNode).operator;
            }
        }
        expr.forEach(r);
        const o = eval(exprStr);
        if (typeof o === 'string') return `"${o}"`;
        return o;
    }

    private typeCheck(type: BuiltIn, spsType: string) {
        switch(type) {
        case 'bool':
            if (spsType === 'boolean')  return true; break;
        case 'string':
            if (spsType === 'string')   return true; break;
        case 'num':
            if (spsType === 'number')   return true; break;
        case 'frac':
            throw "Frac not yet implemented" // TODO: Implement
        case 'void':
            return false; // no var will ever need to be a void
        }
        return false;
    }

    private evaluateVariableDeclaration(n: IVardecNode) {
        this.variables.filter(v => v.name !== n.varname);
        if (['string', 'number', 'boolean'].includes(typeof n.varval)) {
            if (!this.typeCheck(n.vartype, typeof n.varval)) throw `Expected value of ${n.varname} (${n.varval}) to be a ${n.vartype}; got ${typeof n.varval} instead.`;
            this.variables.push({
                name: n.varname,
                type: n.vartype,
                val : n.varval
            } as IVar);
        } else {
            if (n.varval.type === NodeType.Expression) {
                this.variables.push({
                    name: n.varname,
                    type: n.vartype,
                    val : this.parseExpression(n.varval)
                } as IVar);
            } else { // there is only one thing it can be now, a Symbol.
                const vv = n.varval as ISymbolNode;
                const variable = this.parseSymbol(vv);
                if (variable.type !== n.vartype) {
                    throw `Cannot set ${n.varname} to ${variable.val} - they are of different types.`;
                }
                this.variables.push({
                    name: n.varname,
                    type: n.vartype,
                    val : variable.val
                });
            }
        }
    }

    private evaluateFunctionCall(n: IFunctionCallNode) {
        if (standardFunctions[n.name]) {
            return standardFunctions[n.name](...this.nodesToLiterals(n.args));
        } else {
            throw `Function ${n.name} does not exist.`;
        }
    }

    private run(node: INode) {
        switch(node.type) {
        case NodeType.VariableDeclaration:
            this.evaluateVariableDeclaration(node as IVardecNode);
            break;
        case NodeType.FunctionCall:
            this.evaluateFunctionCall(node as IFunctionCallNode);
            break;
        }
    }

    public evaluate() {
        const st = Date.now();
        this.ast.body.forEach(v => this.run(v));
        console.log(chalk.grey(`Evaluated program in ${Date.now() - st} ms`));
    }
}