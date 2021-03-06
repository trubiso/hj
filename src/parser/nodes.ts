import { BuiltIn, Operator } from "../token";

export function getNodeTypeName(n: NodeType) {
    return Object.values(NodeType)[n];
}

export enum NodeType {
    Program, NumberLiteral, Array, UnevaluatedArray, ArrayAccess, StringLiteral, Boolean, Fraction, Symbol, Fundec, FundecArg, Return, VariableDeclaration, VariableAssignment, Expression, FunctionCall, DotAccess, FunctionArguments, Operator, CodeBlock, IfStmt, ElseStmt, WhileStmt, ArrayForStmt, ClassicForStmt, Comma, NullNode
}

export interface INode {
    type: NodeType;
}

export interface IValueNode extends INode {
    value: any;
}

export interface IUnevaluatedArrayNode extends INode {
    elements: IExpressionNode[]
}

export interface IDotAccessNode extends INode {
    accessee: IExpressionNode | ISymbolNode | IDotAccessNode;
    prop: ISymbolNode | IFunctionCallNode;
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
    idx?: IExpressionNode;
    varval: IExpressionNode;
}

export interface IArrayAccessNode extends INode {
    accessee: IExpressionNode | ISymbolNode | IFunctionCallNode; // TODO: support accessing IArrayAccessNode
    start?: IExpressionNode;
    end?: IExpressionNode;
    step?: IExpressionNode;
    hasFirstSep: boolean;
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

export interface IFundecNode extends INode {
    name: string;
    returnType: BuiltIn;
    args: IFundecArgNode[];
    code: ICodeBlockNode;
}

export interface IFundecArgNode extends INode {
    argType: BuiltIn;
    argName: string;
}

export interface IReturnNode extends INode {
    returnValue: IExpressionNode;
}

export interface ICodeBlockNode extends INode {
    nodes: INode[];
}

export interface IIfStmtNode extends INode {
    condition: IExpressionNode;
    code: ICodeBlockNode;
    else?: IElseStmtNode;
}

export interface IArrayForStmtNode extends INode {
    arr: IExpressionNode;
    valSymbol: ISymbolNode;
    code: ICodeBlockNode;
}

export interface IElseStmtNode extends INode {
    code: ICodeBlockNode | IIfStmtNode;
}

export interface IWhileStmtNode extends INode {
    condition: IExpressionNode;
    code: ICodeBlockNode;
}

export interface ICommaNode extends INode {};