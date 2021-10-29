import { ParseError } from "../errors";
import Token, { checkToken, TokenType } from "../token";
import { parseFunctionCall, parseValue, parseOperator, parseSymbol, parseArray, parseDotAccesses, parseArrayAccess } from "./lowLevelWalkers";
import { INode, NodeType } from "./nodes";
import { parseExpression } from "./parseFunctions";
import Parser from "./parser";
import { Walker } from "./walker";

export const expressionWalker : Walker = (parser: Parser): INode => {
    // get the token we're working with
    let token: Token = parser.currentToken;
    // if it's empty, we return a null node (FIXME: this could be better)
    if (!token) return { type: NodeType.NullNode }

    // look at which type the token is and act correspondingly
    switch(token.type) {

    // a value (fallthrough)
    case TokenType.BOOLEAN:
    case TokenType.NUMBER:
    case TokenType.FRACTION:
    case TokenType.STRING:
        return parseValue(parser);

    // an operator
    case TokenType.OPERATOR:
        return parseOperator(parser);
    
    // either a variable or a function call
    case TokenType.SYMBOL:
        let next = parser.next();
        // if we have a parenthesis, it's definitely a function call
        if (next.type === TokenType.SPECIAL && next.value === '(') {
            return parseFunctionCall(parser);
        } else if (checkToken(next, TokenType.SPECIAL, '.')) { // if we have a dot after, dot access
            return parseDotAccesses(parser);
        } else if (checkToken(next, TokenType.SPECIAL, '[')) {
            return parseArrayAccess(parser);
        } else { // if not, then it's a variable
            return parseSymbol(parser); 
        }
    
    // sub-expressions and arrays
    case TokenType.SPECIAL:
        // if there's a ( expression
        if (token.value === '(') {
            parser.current++; // skip it
            const expr = parseExpression(parser, ')');
            parser.current++; // skip closing parenthesis
            return expr;
        } else if (token.value === '[') {
            return parseArray(parser);
        } else { // if it's not then some unimplemented / incorrect syntax was used
            throw `i did not expect you to give me a ${token.value}; yet you DID. disrespectful... smh`
        }
    
    // if none matched, something went wrong
    default:
        throw ParseError.invalidToken('expression', token);
    }
}