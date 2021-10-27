import { BuiltIn, Operator } from "../token";

export function getNodeTypeName(n: NodeType) {
    return Object.values(NodeType)[n];
}

export enum NodeType {
    Program, NumberLiteral, StringLiteral, Boolean, Fraction, Symbol, VariableDeclaration, VariableAssignment, Expression, FunctionCall, FunctionArguments, Operator, CodeBlock, IfStmt, ElseStmt, WhileStmt, Comma, NullNode
}

export interface INode {
    type: NodeType;
}

export interface IValueNode extends INode {
    value: any;
}

export interface ITopNode extends INode {
    body: INode[];
}

export interface IVardecNode extends INode {
    vartype: BuiltIn;
    varval: IExpressionNode;
    varname: string;
}

export interface IVarAssignNode extends INode {
    varname: string;
    varval: IExpressionNode;
}

export interface ISymbolNode extends INode {
    name: string;
}

export interface IOperatorNode extends INode {
    operator: Operator;
}

export interface IExpressionNode extends INode {
    expr: INode[];
}

export interface IFunctionCallNode extends INode {
    name: string;
    args: IFunctionArgumentsNode;
}

export interface IFunctionArgumentsNode extends INode {
    args: IExpressionNode[]
}

export interface ICodeBlockNode extends INode {
    nodes: INode[];
}

export interface IIfStmtNode extends INode {
    condition: IExpressionNode,
    code: ICodeBlockNode,
    else?: IElseStmtNode
}

export interface IElseStmtNode extends INode {
    code: ICodeBlockNode | IIfStmtNode
}

export interface IWhileStmtNode extends INode {
    condition: IExpressionNode,
    code: ICodeBlockNode
}

export interface ICommaNode extends INode {};