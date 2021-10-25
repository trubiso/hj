import chalk from "chalk";
import prompt from "prompt-sync";
import { EvaluationError, TypeError } from "./errors";
import ExpressionEvaluator from "./expressionEvaluator";
import Fraction from "./dataclasses/fraction";
import { INode, ITopNode, IVardecNode, ISymbolNode, NodeType, IExpressionNode, IValueNode, IOperatorNode, IFunctionCallNode } from "./parser";
import { BuiltIn, TokenTypes } from "./token";

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
    print: (...v: any[]) => console.log(...v.map(r => r instanceof Fraction ? r.toString() : r)),
    stringify: (...v: any[]) => v.map((y: any) => y.toString()).join(''),
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

export default class Evaluator {
    private ast: ITopNode;
    private variables: IVar[];

    constructor(ast: ITopNode) {
        this.ast = ast;
        this.variables = [];
    }

    public prettyPrint() {
        console.log(this.prettifyNode(this.ast));
    }

    private prettifyNode(n: INode, il = 0 /* indentation level */) : string {
        let p;
        switch (n.type) {
        case NodeType.VariableDeclaration:
            p = (n as IVardecNode);
            const v = p.varval.type ? `[\n${'\t'.repeat(il + 1)}${this.prettifyNode(p.varval, il + 1)}\n${'\t'.repeat(il + 1)}` : p.varval;
            return `${'\t'.repeat(il)}[Declare variable ${p.varname} with type ${p.vartype} and value ${v}]`;
        case NodeType.Expression:
            p = (n as IExpressionNode);
            return `${'\t'.repeat(il)}[Expression [\n${'\t'.repeat(il + 1)}${p.expr.map(v => this.prettifyNode(v, il)).join(`, \n${'\t'.repeat(il + 1)}`)}\n${'\t'.repeat(il + 1)}]`;
        case NodeType.FunctionCall:
            p = n as IFunctionCallNode;
            return `${'\t'.repeat(il)}[Call function ${p.name} with args [\n${'\t'.repeat(il + 1)}${p.args.map(v => this.prettifyNode(v, il + 1)).join(`, \n${'\t'.repeat(il + 1)}`)}\n${'\t'.repeat(il + 1)}]`;
        case NodeType.StringLiteral:
            p = n as IValueNode;
            return `${'\t'.repeat(il)}[String literal ${p.value}]`;
        case NodeType.NumberLiteral:
            p = n as IValueNode;
            return `${'\t'.repeat(il)}[Number literal ${p.value}]`;
        case NodeType.Boolean:
            p = n as IValueNode;
            return `${'\t'.repeat(il)}[Boolean literal ${p.value}]`;
        case NodeType.Fraction:
            p = n as IValueNode;
            return `${'\t'.repeat(il)}[Fraction literal ${p.value.toString()}]`;
        case NodeType.Symbol: case NodeType.UnparsedSymbol:
            p = n as ISymbolNode;
            return `${'\t'.repeat(il)}[Symbol ${p.name}]`;
        case NodeType.UnparsedOperator:
            p = n as IOperatorNode;
            return `${'\t'.repeat(il)}[Operator ${p.operator}]`;
        case NodeType.Comma:
            p = n as IOperatorNode;
            return `${'\t'.repeat(il)}[Comma]`;
        case NodeType.Program:
            p = n as ITopNode;
            return `${'\t'.repeat(il)}[Program:\n\t${p.body.map(v => this.prettifyNode(v)).join('\n\t')}\n]`
        default:
            return `[Unsupported node]`
        }
        
    }

    private parseSymbol(s: ISymbolNode, c = true) : IVar {
        const r = this.variables.find(y => y.name === s.name);
        if (!r) {
            throw TypeError.symbolNotFound(s, this.variables);
        }
        const t = {
            name: r.name,
            type: r.type,
            val : r.val
        } as IVar;
        return t;
    }

    private nodesToLiterals(n : INode[]) : any[] {
        return n.map(v => {
            switch(v.type) {
            case NodeType.UnparsedSymbol:
            case NodeType.Symbol:
                return this.parseSymbol(v as ISymbolNode).val;
            case NodeType.StringLiteral:
            case NodeType.NumberLiteral:
            case NodeType.Boolean:
            case NodeType.Fraction:
                return (v as IValueNode).value;
            case NodeType.Expression:
                let e = this.parseExpression(v as IExpressionNode);
                return e;
            case NodeType.UnparsedOperator:
                return (v as IOperatorNode).operator;
            case NodeType.FunctionCall:
                return this.evaluateFunctionCall(v as IFunctionCallNode); // WARNING: this could cause recursiveness
            default:
                return null;
            }
        }).filter(v => v);
    }

    private parseExpression(n : IExpressionNode) : any {
        const p = (v: INode) : INode => { // this name is VERY descriptive. what does this function do? it p
            if (v.type === NodeType.UnparsedSymbol) {
                const r = this.parseSymbol(v as ISymbolNode, false);
                switch(r.type) {
                case 'string':
                    return {
                        type: NodeType.StringLiteral,
                        value: r.val
                    } as IValueNode;
                case 'bool':
                    return {
                        type: NodeType.Boolean,
                        value: r.val
                    } as IValueNode;
                case 'num':
                    return {
                        type: NodeType.NumberLiteral,
                        value: r.val
                    } as IValueNode;
                case 'frac':
                    return {
                        type: NodeType.Fraction,
                        value: r.val
                    } as IValueNode;
                default:
                    throw "what"; // I feel that
                }
            } else if (v.type === NodeType.Expression) {
                const e = (v as IExpressionNode).expr.map(p);
                return {
                    type: NodeType.Expression,
                    expr: e
                } as IExpressionNode;
            } else if (v.type === NodeType.FunctionCall) {
                const t = this.evaluateFunctionCall(v as IFunctionCallNode);
                return {type: typeof t === "string" ? NodeType.StringLiteral : (typeof t === "number" ? NodeType.NumberLiteral : (typeof t === "boolean" ? NodeType.Boolean : (t instanceof Fraction ? NodeType.Fraction : NodeType.Symbol))), value: t} as IValueNode;
            } else {
                return v as INode;
            }
        }
 
        const expr : IExpressionNode = {
            type: NodeType.Expression,
            expr: n.expr.map(p)
        }

        return ExpressionEvaluator.evaluateExpressionNode(expr).value;
        /*// Parse symbols into IVars
        const p = (v: INode | IVar) : any => { // this name is VERY descriptive. what does this function do? it p
            if (v.type === NodeType.UnparsedSymbol) {
                return this.parseSymbol(v as ISymbolNode, false);
            } else if (v.type === NodeType.Expression) {
                return (v as IExpressionNode).expr.map(p);
            } else if (v.type === NodeType.FunctionCall) {
                const t = this.evaluateFunctionCall(v as IFunctionCallNode);
                return {type: typeof t === "string" ? NodeType.StringLiteral : (typeof t === "number" ? NodeType.NumberLiteral : NodeType.Symbol), value: t} as IValueNode;
            } else {
                return v;
            }
        }

        const expr : ExprType[] = n.expr.map(p);
        console.log(expr);

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
                    if ((v as IValueNode).type === NodeType.StringLiteral) exprStr += `("${(v as IValueNode).value}")`;
                    else exprStr += `(${(v as IValueNode).value})`;
                }
            } else {
                exprStr += (v as IOperatorNode).operator;
            }
        }
        expr.forEach(r);
        const o = eval(exprStr);
        //if (typeof o === 'string') return `"${o}"`;
        return o;*/
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
            if (spsType === 'fraction') return true; break;
        case 'void':
            return false; // no var will ever need to be a void
        }
        return false;
    }

    private evaluateVariableDeclaration(n: IVardecNode) {
        this.variables.filter(v => v.name !== n.varname);
        if (n.varval instanceof Fraction) {
            console.log("this is great");
            if (!this.typeCheck(n.vartype, "fraction")) throw TypeError.vardecTypeCheckError(n);
            this.variables.push({
                name: n.varname,
                type: n.vartype,
                val : n.varval
            } as IVar);
        } else if (['string', 'number', 'boolean'].includes(typeof n.varval)) {
            if (!this.typeCheck(n.vartype, typeof n.varval)) throw TypeError.vardecTypeCheckError(n);
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
            } else if (n.varval.type === NodeType.FunctionCall) {
                const e = this.evaluateFunctionCall(n.varval);
                if (!this.typeCheck(n.vartype, e instanceof Fraction ? "fraction" : typeof e)) throw TypeError.vardecTypeCheckError(n);
                this.variables.push({
                    name: n.varname,
                    type: n.vartype,
                    val : e
                });
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
            throw TypeError.functionNotFound(n);
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
        default:
            throw EvaluationError.invalidProgramStructure(node);
        }
    }

    public evaluate() {
        const st = Date.now();
        this.ast.body.forEach(v => this.run(v));
        console.log(chalk.grey(`Evaluated program in ${Date.now() - st} ms`));
    }
}