import chalk from "chalk";
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

export const standardFunctions: any = {
    print: console.log
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
            throw `The symbol ${s.name} does not exist.`;
        }
        return r;
    }

    private nodesToLiterals(n : INode[]) : any[] {
        return n.map(v => {
            if (v.type === NodeType.UnparsedSymbol || v.type === NodeType.Symbol) return this.parseSymbol(v as ISymbolNode).val;
            if (v.type === NodeType.StringLiteral || v.type === NodeType.NumberLiteral) return (v as IValueNode).value;
            if (v.type === NodeType.Expression) return this.parseExpression(v as IExpressionNode);
            if (v.type === NodeType.UnparsedOperator) return (v as IOperatorNode).operator;
            return null;
        }).filter(v => v);
    }

    private parseExpression(n : IExpressionNode) : any {
        // Parse symbols into IVars
        const expr : (INode | IVar)[] = n.expr.map(v => {
            if (v.type === NodeType.UnparsedSymbol) {
                return this.parseSymbol(v as ISymbolNode);
            } else {
                return v;
            }
        });

        // Convert into mathematical expression
        let exprStr = "";
        expr.forEach(v => {
            if (v.type !== NodeType.UnparsedOperator) {
                if (typeof v.type === "string") {
                    exprStr += `(${(v as IVar).val})`;
                } else {
                    exprStr += `(${(v as IValueNode).value})`;
                }
            } else {
                exprStr += (v as IOperatorNode).operator;
            }
        });

        return eval(exprStr);
    }

    private evaluateVariableDeclaration(n: IVardecNode) {
        this.variables.filter(v => v.name !== n.varname);
        if (['string', 'number', 'boolean'].includes(typeof n.varval)) {
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
                    throw `Cannot set ${n.varname} to ${variable.val} - they are of different types (TODO: casting).`;
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
            standardFunctions[n.name](...this.nodesToLiterals(n.args));
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