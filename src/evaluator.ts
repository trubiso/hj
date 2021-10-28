import chalk from "chalk";
import prompt from "prompt-sync";
import { EvaluationError, TypeError } from "./errors";
import ExpressionEvaluator from "./expressionEvaluator";
import Fraction from "./dataclasses/fraction";
import { BuiltIn, TokenTypes } from "./token";
import { INode, ITopNode, NodeType, IVardecNode, IExpressionNode, IFunctionCallNode, IValueNode, ISymbolNode, IOperatorNode, IIfStmtNode, ICodeBlockNode, IWhileStmtNode, IVarAssignNode, IDotAccessNode, IUnevaluatedArrayNode } from "./parser/nodes";

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
            const v = e.variables.find(v => v.name === s.name)?.val.pop()
            return {
                type: Evaluator.getType(v),
                value: v
            };
        }) as DotFunction,
        last: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            const v = arr[arr.length - 1];
            return {
                type: Evaluator.getType(v),
                value: v
            };
        }) as DotFunction,
        push: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.NumberLiteral,
                value: e.variables.find(v => v.name === s.name)?.val.push(...i)
            };
        }) as DotFunction,
        reverse: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            return {
                type: NodeType.Array,
                value: e.variables.find(v => v.name === s.name)?.val.reverse()
            };
        }) as DotFunction,
        shift: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const v = e.variables.find(v => v.name === s.name)?.val.shift()
            return {
                type: Evaluator.getType(v),
                value: v
            };
        }) as DotFunction,
        first: ((e: Evaluator, s: ISymbolNode, ...i: any[]): IValueNode => {
            const arr: any[] = e.variables.find(v => v.name === s.name)?.val;
            const v = arr[0];
            return {
                type: Evaluator.getType(v),
                value: v
            };
        }) as DotFunction
    }
}

export default class Evaluator {
    private ast: ITopNode;
    public variables: IVar[];

    constructor(ast: ITopNode) {
        this.ast = ast;
        this.variables = [];
    }

    public prettyPrint() {
        console.log(this.prettifyNode(this.ast));
    }

    static getType(n: any) {
        if (typeof n === 'string') return NodeType.StringLiteral;
        if (typeof n === 'boolean') return NodeType.Boolean;
        if (typeof n === 'number') return NodeType.NumberLiteral;
        if (n instanceof Fraction) return NodeType.Fraction;
        if (n.length) return NodeType.Array;
        throw `Unsupported type: ${typeof n}`;
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
            return `${'\t'.repeat(il)}[Call function ${p.name} with args [\n${'\t'.repeat(il + 1)}${p.args.args.map(v => this.prettifyNode(v, il + 1)).join(`, \n${'\t'.repeat(il + 1)}`)}\n${'\t'.repeat(il + 1)}]`;
        case NodeType.StringLiteral:
            p = n as IValueNode;
            return `${'\t'.repeat(il)}[String literal "${p.value}"]`;
        case NodeType.NumberLiteral:
            p = n as IValueNode;
            return `${'\t'.repeat(il)}[Number literal ${p.value}]`;
        case NodeType.Boolean:
            p = n as IValueNode;
            return `${'\t'.repeat(il)}[Boolean literal ${p.value}]`;
        case NodeType.Fraction:
            p = n as IValueNode;
            return `${'\t'.repeat(il)}[Fraction literal ${p.value.toString()}]`;
        case NodeType.Symbol: case NodeType.Symbol:
            p = n as ISymbolNode;
            return `${'\t'.repeat(il)}[Symbol ${p.name}]`;
        case NodeType.Operator:
            p = n as IOperatorNode;
            return `${'\t'.repeat(il)}[Operator ${p.operator}]`;
        case NodeType.Comma:
            p = n as IOperatorNode;
            return `${'\t'.repeat(il)}[Comma]`;
        case NodeType.Program:
            p = n as ITopNode;
            return `${'\t'.repeat(il)}[Program:\n\t${p.body.map(v => this.prettifyNode(v)).join('\n\t')}\n]`
        case NodeType.IfStmt:
            p = n as IIfStmtNode;
            return `${'\t'.repeat(il)}[If Statement with condition \n${'\t'.repeat(il + 1)}${this.prettifyNode(p.condition, il + 1)} and code block \n${'\t'.repeat(il + 1)}${this.prettifyNode(p.code, il + 1)}]`
        case NodeType.CodeBlock:
            p = n as ICodeBlockNode;
            return `${'\t'.repeat(il)}[Code block: \n${'\t'.repeat(il + 1)}${p.nodes.map(v => this.prettifyNode(v, il + 1)).join(`, \n${'\t'.repeat(il + 1)}`)}]`;
        default:
            return `[Unsupported node]`
        }
        
    }

    private parseSymbol(s: ISymbolNode) : IVar {
        const r = this.variables.find(y => y.name === s.name);
        if (!r) {
            throw TypeError.symbolNotFound(s.name, this.variables);
        }
        const t = {
            name: r.name,
            type: r.type,
            val : r.val
        } as IVar;
        return t;
    }

    private evaluateExpression(n : IExpressionNode) : any {
        if (!n.type) return n;
        const p = (v: INode) : INode => { // this name is VERY descriptive. what does this function do? it p
            if (v.type === NodeType.Symbol) {
                const r = this.parseSymbol(v as ISymbolNode);
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
                case 'array':
                    return {
                        type: NodeType.Array,
                        value: r.val
                    } as IValueNode;
                default:
                    throw "what"; // I feel that
                }
            } else if (v.type === NodeType.UnevaluatedArray) {
                return {
                    type: NodeType.Array,
                    value: (v as IUnevaluatedArrayNode).elements.map((v: IExpressionNode) => this.evaluateExpression(v))
                } as IValueNode;
            } else if (v.type === NodeType.Expression) {
                const e = (v as IExpressionNode).expr.map(p);
                return {
                    type: NodeType.Expression,
                    expr: e
                } as IExpressionNode;
            } else if (v.type === NodeType.FunctionCall) {
                const t = this.evaluateFunctionCall(v as IFunctionCallNode);
                return {type: typeof t === "string" ? NodeType.StringLiteral : (typeof t === "number" ? NodeType.NumberLiteral : (typeof t === "boolean" ? NodeType.Boolean : (t instanceof Fraction ? NodeType.Fraction : NodeType.Symbol))), value: t} as IValueNode;
            } else if (v.type === NodeType.DotAccess) {
                return this.evaluateDotAccess(v as IDotAccessNode);
            } else {
                return v as INode;
            }
        }
 
        const expr : IExpressionNode = {
            type: NodeType.Expression,
            expr: n.expr.map(p)
        }

        return ExpressionEvaluator.evaluateExpressionNode(expr).value;
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
                    val : this.evaluateExpression(n.varval)
                } as IVar);
            } else {
                throw `what did you do`; // I feel that #2
            }
        }  
    }

    private evaluateVariableAssignment(n: IVarAssignNode) {
        let correspondingVar = this.variables.find(v => v.name === n.varname);
        if (!correspondingVar) throw TypeError.symbolNotFound(n.varname, this.variables);
        correspondingVar.val = this.evaluateExpression(n.varval);
    }

    private evaluateDotAccess(n: IDotAccessNode): IValueNode {
        const variable = n.symbol;
        const property = n.property;
        if (n.args) return dotFunctions[this.parseSymbol(variable).type][property](this, variable, ...n.args.args.map(arg => this.evaluateExpression(arg)));
        else return dotProps[this.parseSymbol(variable).type][property](this, variable);
    }

    private evaluateFunctionCall(n: IFunctionCallNode) {
        if (standardFunctions[n.name]) {
            return standardFunctions[n.name](...n.args.args.map(arg => this.evaluateExpression(arg)));
        } else {
            throw TypeError.functionNotFound(n);
        }
    }

    private evaluateIfStatement(n: IIfStmtNode) {
        if (this.evaluateExpression(n.condition)) {
            this.run(n.code);
        } else {
            if (n.else) {
                this.run(n.else.code);
            }
        }
    }

    private evaluateWhileStatement(n: IWhileStmtNode) {
        while (this.evaluateExpression(n.condition)) {
            this.run(n.code);
        }
    }

    private run(node: INode) {
        switch(node.type) {
        case NodeType.VariableDeclaration:
            this.evaluateVariableDeclaration(node as IVardecNode);
            break;
        case NodeType.VariableAssignment:
            this.evaluateVariableAssignment(node as IVarAssignNode);
            break;
        case NodeType.DotAccess:
            this.evaluateDotAccess(node as IDotAccessNode);
            break;
        case NodeType.FunctionCall:
            this.evaluateFunctionCall(node as IFunctionCallNode);
            break;
        case NodeType.IfStmt:
            this.evaluateIfStatement(node as IIfStmtNode);
            break;
        case NodeType.WhileStmt:
            this.evaluateWhileStatement(node as IWhileStmtNode);
            break;
        case NodeType.CodeBlock:
            for (const subNode of (node as ICodeBlockNode).nodes) {
                this.run(subNode);
            }
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