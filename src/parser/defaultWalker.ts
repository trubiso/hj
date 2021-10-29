import Parser from './parser'
import Token, { TokenType, getTokenTypeName, BuiltIn } from '../token'
import { ParseError } from '../errors'
import { Walker } from './walker';
import { parseVariableDeclaration, parseControlStructure, parseFunctionCall, parseVariableAssignment, parseCodeBlock, parseDotAccess, parseDotAccesses } from './lowLevelWalkers';
import { INode, NodeType } from './nodes';

// the walker that handles tokens that start a general command, like a variable declaration
export const defaultWalker : Walker = (parser: Parser): INode => {
    // get the token we're working with
    let token: Token = parser.currentToken;
    // if it's empty, we return a null node (FIXME: this could be better)
    if (!token) return { type: NodeType.NullNode }

    // look at which type the token is and act correspondingly
    switch(token.type) {

    // a variable declaration starts
    case TokenType.BUILTIN:
        return parseVariableDeclaration(parser);
    
    // a structure like an if-statement starts
    case TokenType.KEYWORD:
        return parseControlStructure(parser);
    
    // either an assignment or a function call starts
    case TokenType.SYMBOL:
        let next = parser.next();
        // if we have a parenthesis, it's definitely a function call
        if (next.type === TokenType.SPECIAL && next.value === '(') {
            return parseFunctionCall(parser);
        } else if (next.type === TokenType.SPECIAL && next.value === '.') {
            return parseDotAccesses(parser);
        } else { // if not, then it's either a variable assignment or incorrect syntax
            return parseVariableAssignment(parser); 
        }
    
    // for now, only code blocks
    case TokenType.SPECIAL:
        // if there's a { it's a code block
        if (token.value === '{') {
            return parseCodeBlock(parser);
        } else if (token.value === ';') {
            parser.current++;
            return defaultWalker(parser);
        } else { // if it's not then some unimplemented / incorrect syntax was used
            throw `i did not expect you to give me a ${token.value}; yet you DID. disrespectful... smh`
        }
    
    // if none matched, something went wrong
    default:
        throw ParseError.invalidToken('general command', token);
    }
}