import chalk from "chalk";
import { EvaluationError, TypeError } from "./errors";
import ExpressionEvaluator from "./expressionEvaluator";
import Fraction from "./dataclasses/fraction";
import { BuiltIn } from "./token";
import { INode, ITopNode, NodeType, IVardecNode, IExpressionNode, IFunctionCallNode, IValueNode, ISymbolNode, IOperatorNode, IIfStmtNode, ICodeBlockNode, IWhileStmtNode, IVarAssignNode, IDotAccessNode, IUnevaluatedArrayNode, getNodeTypeName, IFunctionArgumentsNode, IArrayAccessNode, IArrayForStmtNode, IFundecNode, IReturnNode } from "./parser/nodes";
import { dotFunctions, dotProps, standardFunctions } from "./languageFunctions";
import Array from "./dataclasses/array";

export interface IVar {
    name: string,
    val: any,
    type: BuiltIn
}

export interface IFunctionArg {
    type: BuiltIn,
    name: string
}

export interface IFunction {
    name: string,
    returnType: BuiltIn,
    args: IFunctionArg[],
    code: ICodeBlockNode
}

export interface IDummy<T> { // this interface sucks
    d: T
};

export type ExprType = (INode | IVar | ExprType)[]

export default class Evaluator {
    private ast: ITopNode;
    public variables: IVar[];
    public functions: IFunction[];

    constructor(ast: ITopNode) {
        this.ast = ast;
        this.variables = [];
        this.functions = [];
    }

    public prettyPrint() {
        console.log(Evaluator.prettifyNode(this.ast));
    }

    static getType(n: any) {
        if (typeof n === 'string') return NodeType.StringLiteral;
        if (typeof n === 'boolean') return NodeType.Boolean;
        if (typeof n === 'number') return NodeType.NumberLiteral;
        if (n instanceof Fraction) return NodeType.Fraction;
        if (n.length !== undefined) return NodeType.Array;
        throw `Unsupported type: ${typeof n}`;
    }

    static getTypeAsBuiltIn(n: any): BuiltIn {
        if (typeof n === 'string') return 'string';
        if (typeof n === 'boolean') return 'bool';
        if (typeof n === 'number') return 'num';
        if (n instanceof Fraction) return 'frac';
        if (n.length !== undefined) return 'array';
        throw `Unsupported type: ${typeof n}`;
    }

    public static prettifyNode(n: INode, il = 0 /* indentation level */) : string {
        let p, v;
        switch (n.type) {
        case NodeType.VariableDeclaration:
            p = (n as IVardecNode);
            v = p.varval.type ? `[\n${'\t'.repeat(il + 1)}${this.prettifyNode(p.varval, il + 1)}\n${'\t'.repeat(il + 1)}` : p.varval;
            return `${' '.repeat(il)}[Declare variable ${p.varname} with type ${p.vartype} and value ${v}]`;
        case NodeType.VariableAssignment:
            p = (n as IVarAssignNode);
            v = p.varval.type ? `[\n${'\t'.repeat(il + 1)}${this.prettifyNode(p.varval, il + 1)}\n${'\t'.repeat(il + 1)}` : p.varval;
            return `${' '.repeat(il)}[Assign variable ${p.varname}${p.idx !== undefined ? ` @ idx ${p.idx}` : ``} to value ${v}]`;
        case NodeType.Expression:
            p = (n as IExpressionNode);
            return `${' '.repeat(il)}[Expression [\n${' '.repeat(il + 1)}${p.expr.map(v => this.prettifyNode(v, il)).join(`, \n${' '.repeat(il + 1)}`)}\n${' '.repeat(il + 1)}]`;
        case NodeType.FunctionCall:
            p = n as IFunctionCallNode;
            return `${' '.repeat(il)}[Call function ${p.name} with args [\n${' '.repeat(il + 1)}${p.args.args.map(v => this.prettifyNode(v, il + 1)).join(`, \n${' '.repeat(il + 1)}`)}\n${' '.repeat(il + 1)}]`;
        case NodeType.StringLiteral:
            p = n as IValueNode;
            return `${' '.repeat(il)}[String literal "${p.value}"]`;
        case NodeType.NumberLiteral:
            p = n as IValueNode;
            return `${' '.repeat(il)}[Number literal ${p.value}]`;
        case NodeType.Boolean:
            p = n as IValueNode;
            return `${' '.repeat(il)}[Boolean literal ${p.value}]`;
        case NodeType.Fraction:
            p = n as IValueNode;
            return `${' '.repeat(il)}[Fraction literal ${p.value.toString()}]`;
        case NodeType.Symbol: case NodeType.Symbol:
            p = n as ISymbolNode;
            return `${' '.repeat(il)}[Symbol ${p.name}]`;
        case NodeType.Operator:
            p = n as IOperatorNode;
            return `${' '.repeat(il)}[Operator ${p.operator}]`;
        case NodeType.Comma:
            p = n as IOperatorNode;
            return `${' '.repeat(il)}[Comma]`;
        case NodeType.Program:
            p = n as ITopNode;
            return `${' '.repeat(il)}[Program:\n\t${p.body.map(v => this.prettifyNode(v)).join('\n\t')}\n]`
        case NodeType.IfStmt:
            p = n as IIfStmtNode;
            return `${' '.repeat(il)}[If Statement with condition \n${' '.repeat(il + 1)}${this.prettifyNode(p.condition, il + 1)} and code block \n${' '.repeat(il + 1)}${this.prettifyNode(p.code, il + 1)}${p.else ? ` (else code block is ${this.prettifyNode(p.else, il + 1)})` : ``}]`
        case NodeType.WhileStmt:
            p = n as IWhileStmtNode;
            return `${' '.repeat(il)}[While Statement with condition \n${' '.repeat(il + 1)}${this.prettifyNode(p.condition, il + 1)} and code block \n${' '.repeat(il + 1)}${this.prettifyNode(p.code, il + 1)}]`
        case NodeType.CodeBlock:
            p = n as ICodeBlockNode;
            return `${' '.repeat(il)}[Code block: \n${' '.repeat(il + 1)}${p.nodes.map(v => this.prettifyNode(v, il + 1)).join(`, \n${' '.repeat(il + 1)}`)}]`;
        case NodeType.DotAccess:
            p = n as IDotAccessNode;
            return `${' '.repeat(il)}[Dot access with accessee ${this.prettifyNode(p.accessee, 0)} accessing prop/func ${this.prettifyNode(p.prop, 0)}]`;
        case NodeType.ArrayAccess:
            p = n as IArrayAccessNode;
            return `${' '.repeat(il)}[Array access: ${this.prettifyNode(p.accessee, 0)}@${[p.start, p.step, p.end].map(v => v === undefined ? v : this.prettifyNode(v)).filter(v => v !== undefined).join(':')}]`;
        case NodeType.Fundec:
            p = n as IFundecNode;
            return `FUNDEC ${this.prettifyNode(p.code)}` // todo: make it better
        default:
            return `${' '.repeat(il)}[${getNodeTypeName(n.type)}]`;
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

    public evaluateExpression(n : IExpressionNode) : any {
        if (!n.type) return n;
        const p = (v: INode) : INode => { // this name is VERY descriptive. what does this function do? it p
            if (v.type === NodeType.Symbol) {
                return this.getValueNodeFromVariable((v as ISymbolNode));
            } else if (v.type === NodeType.UnevaluatedArray) {
                return {
                    type: NodeType.Array,
                    value: new Array(...(v as IUnevaluatedArrayNode).elements.map((v: IExpressionNode) => this.evaluateExpression(v)))
                } as IValueNode;
            } else if (v.type === NodeType.Expression) {
                const e = (v as IExpressionNode).expr.map(p);
                return {
                    type: NodeType.Expression,
                    expr: e
                } as IExpressionNode;
            } else if (v.type === NodeType.FunctionCall) {
                const t = this.evaluateFunctionCall(v as IFunctionCallNode);
                return {type: Evaluator.getType(t), value: t} as IValueNode;
            } else if (v.type === NodeType.DotAccess) {
                return this.evaluateDotAccess(v as IDotAccessNode);
            } else if (v.type === NodeType.ArrayAccess) {
                const n = v as IArrayAccessNode;
                let k; // k will hold the variable
                if (n.accessee.type === NodeType.FunctionCall) {
                    k = this.evaluateFunctionCall(n.accessee as IFunctionCallNode);
                } else if (n.accessee.type === NodeType.Expression) {
                    k = this.evaluateExpression(n.accessee as IExpressionNode).value;
                } else if (n.accessee.type === NodeType.Symbol) {
                    k = this.variables.find(r => r.name === (n.accessee as ISymbolNode).name)?.val
                } else {
                    throw `up`; // get the pun?
                }
                return k.access(...[n.start, n.end, n.step].map(r => r ? this.evaluateExpression(r) : r), n.hasFirstSep);
            } else {
                return v as INode;
            }
        }
 
        const expr : IExpressionNode = {
            type: NodeType.Expression,
            expr: n.expr.map(p)
        }

        return ExpressionEvaluator.evaluateExpressionNode(expr);
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
                const v = {
                    name: n.varname,
                    type: n.vartype,
                    val : this.evaluateExpression(n.varval).value
                } as IVar;
                this.variables.push(v);
            } else {
                throw `what did you do`; // I feel that #2
            }
        }  
    }

    private getValueNodeFromVariable(variable: ISymbolNode): IValueNode {
        const r = this.parseSymbol(variable);
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
    }

    private evaluateVariableAssignment(n: IVarAssignNode) {
        let correspondingVar = this.variables.find(v => v.name === n.varname);
        if (!correspondingVar) throw TypeError.symbolNotFound(n.varname, this.variables);
        if (n.idx !== undefined) {
            const idx = this.evaluateExpression(n.idx).value;
            if (correspondingVar.val instanceof Array) correspondingVar.val.set(idx, this.evaluateExpression(n.varval));
            else correspondingVar.val[idx] = this.evaluateExpression(n.varval).value;
        } else correspondingVar.val = this.evaluateExpression(n.varval).value;
    }

    private evaluateDotAccess(n: IDotAccessNode): IValueNode {
        let accessee: IValueNode | IExpressionNode | ISymbolNode | IDotAccessNode = n.accessee;
        if (accessee.type === NodeType.DotAccess) {
            accessee = this.evaluateDotAccess((accessee as IDotAccessNode))
        } else if (accessee.type === NodeType.Symbol) {
            accessee = this.getValueNodeFromVariable((accessee as ISymbolNode))
        } else {
            accessee = this.evaluateExpression((accessee as IExpressionNode));
        }
        const property = n.prop;
        if (property.type == NodeType.FunctionCall) return dotFunctions(accessee as IValueNode, property as IFunctionCallNode, this);
        else return dotProps(accessee as IValueNode, property as ISymbolNode);
    }

    private evaluateFunctionCall(n: IFunctionCallNode) {
        const args = n.args.args.map(arg => this.evaluateExpression(arg));
        if (standardFunctions[n.name]) {
            // github copilot's opinion:
            // const wonderfulStory = "Once upon a time, there was a function called " + n.name + " and it was awesome";
            // console.log(wonderfulStory);
            return standardFunctions[n.name](...args);
        } else {
            const f = this.functions.find(v => v.name === n.name);
            if (!f) throw TypeError.functionNotFound(n);
            const argVars = args.map((v, i) => {
                return {
                    name: f.args[i].name,
                    type: f.args[i].type,
                    val: v.value
                } as IVar;
            })
            const ret = this.evaluateCodeBlock(f.code, ...argVars);
            return ret.value;
        }
    }

    private evaluateIfStatement(n: IIfStmtNode) {
        if (this.evaluateExpression(n.condition).value == true) {
            this.evaluateCodeBlock(n.code);
        } else {
            if (n.else) {
                if (n.else.code.type === NodeType.IfStmt) this.evaluateIfStatement(n.else.code as IIfStmtNode);
                else this.run(n.else.code);
            }
        }
    }

    private evaluateWhileStatement(n: IWhileStmtNode) {
        while (this.evaluateExpression(n.condition).value == true) {
            this.evaluateCodeBlock(n.code);
        }
    }

    private evaluateArrayForStatement(n: IArrayForStmtNode) {
        if (this.variables.some(v => v.name === n.valSymbol.name)) throw `DONT DO THAT :(((`; // TODO: better error
        const arr: Array = this.evaluateExpression(n.arr).value; // FIXME: wont work on strings; perhaps it's a good idea
        if (!arr.start) return;
        let idxVar = {
            type: Evaluator.getTypeAsBuiltIn(arr.start!.value),
            name: n.valSymbol.name,
            val: arr.start!.value
        } as IVar;
        arr.forEach(v => {
            idxVar.val = v;
            this.evaluateCodeBlock(n.code, idxVar);
        });
    }

    private evaluateFunctionDeclaration(n: IFundecNode) {
        const v = {
            name: n.name,
            args: n.args.map(v => {
                return {
                    name: v.argName,
                    type: v.argType
                } as IFunctionArg;
            }),
            returnType: n.returnType,
            code: n.code
        } as IFunction;
        this.functions.push(v);
    }

    private evaluateCodeBlock(n: ICodeBlockNode, ...extraVars: IVar[]) {
        const e = new Evaluator(this.ast);
        e.variables = [...this.variables, ...extraVars].map(x => ({...x}));
        e.functions = this.functions.map(x => ({...x}));
        for (const subNode of n.nodes) {
            if (subNode.type === NodeType.Return) {
                return e.evaluateExpression((subNode as IReturnNode).returnValue);
            }
            e.run(subNode);
        }
        return null;
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
        case NodeType.ArrayForStmt:
            this.evaluateArrayForStatement(node as IArrayForStmtNode);
            break;
        case NodeType.Fundec:
            this.evaluateFunctionDeclaration(node as IFundecNode);
            break;
        case NodeType.CodeBlock:
            this.evaluateCodeBlock(node as ICodeBlockNode);
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