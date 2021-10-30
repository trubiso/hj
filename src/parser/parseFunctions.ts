import Parser from "./parser";
import { BuiltIn, TokenType } from "../token";
import { NodeType, IExpressionNode, INode, IValueNode } from "./nodes";
import { expressionWalker } from "./expressionWalker";

type Delimiter = ')' | ';' | ',' | ']' | '.' | ':' | '[';

export function parseExpression(parser: Parser, ...delims: Delimiter[]): IExpressionNode {
    const expression = {
        type: NodeType.Expression,
        expr: []
    } as IExpressionNode;

    while (!([TokenType.SPECIAL, TokenType.OTHER].includes(parser.currentToken.type) && (delims as string[]).includes(parser.currentToken.value))) {
        expression.expr.push(expressionWalker(parser));
    }
    return expression;
}