import { INode, ITopNode, IVardecNode, ISymbolNode, NodeType, IExpressionNode, IValueNode, IOperatorNode } from "./parser";
import { BuiltIn } from "./token";

interface IVar {
    name: string,
    val: any,
    type: BuiltIn
}

interface IDummy<T> {
    d: T
};

export default class Evaluator {
    private ast: ITopNode;
    private variables: IVar[];

    constructor(ast: ITopNode) {
        this.ast = ast;
        this.variables = [];
    }

    private parseExpression(n : IExpressionNode) : any {
        // Parse symbols into IVars
        const expr : (INode | IVar)[] = n.expr.map(v => {
            if (v.type === NodeType.UnparsedSymbol) {
                const r = this.variables.find(y => y.name === (v as ISymbolNode).name);
                if (!r) {
                    throw `The symbol ${(v as ISymbolNode).name} does not exist.`;
                }
                return r;
            } else {
                return v;
            }
        });

        // Convert into mathematical expression
        let exprStr = "";
        expr.forEach(v => {
            if (v.type !== NodeType.UnparsedOperator) {
                if (typeof v.type === "string") {
                    exprStr += (v as IVar).val;
                } else {
                    exprStr += (v as IValueNode).value;
                }
            } else {
                exprStr += (v as IOperatorNode).operator;
            }
        });

        console.log(exprStr);
        return(eval(exprStr));
    }

    private run(node: INode) {
        switch(node.type) {
        case NodeType.VariableDeclaration:
            const n = (node as IVardecNode);
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
                    const variable = this.variables.find(v => v.name === vv.name);
                    if (!variable) {
                        throw `The symbol ${vv.name} does not exist.`;
                    }
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
    }

    public evaluate() {
        this.ast.body.forEach(v => this.run(v));
        console.log(this.variables);
    }
}