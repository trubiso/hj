import Parser from './parser'
import Token, { TokenType, getTokenTypeName, BuiltIn, Keyword } from '../token'
import { ParseError, SyntaxError, UnimplementedError } from '../errors'
import { Walker } from './walker';
import { parseExpression } from './parseFunctions';
import { INode, NodeType, ICodeBlockNode, IVardecNode, IExpressionNode, IIfStmtNode, IElseStmtNode, getNodeTypeName, IWhileStmtNode, IVarAssignNode, IFunctionCallNode, IValueNode, IOperatorNode, ISymbolNode, IFunctionArgumentsNode, IUnevaluatedArrayNode, IArrayForStmtNode, IDotAccessNode } from './nodes';
import Fraction from '../dataclasses/fraction';

export const parseCodeBlock : Walker = (parser: Parser): INode => {
    const n = {
        type: NodeType.CodeBlock,
        nodes: [] // we'll add the nodes later down in the code
    } as ICodeBlockNode;
    parser.current++; // skip starting {
    while(!(parser.currentToken.value === '}' && parser.currentToken.type === TokenType.SPECIAL)) { // while the current token isn't a },
        if (parser.currentToken.value === ';' && parser.currentToken.type === TokenType.SPECIAL)  { // if we get a semicolon
            parser.current++; // skip
            continue; // and keep walking
        }
        n.nodes.push(parser.walk()); // walk and push all the nodes into the code block
    }
    parser.current++; // skip closing }
    return n;
}

export const parseVariableDeclaration : Walker = (parser: Parser): INode => {
    let token: Token = parser.currentToken;
    if (!token) return { type: NodeType.NullNode }
    
    const nameTok = parser.next();

    // check if the name node is correct
    if (nameTok.type !== TokenType.SYMBOL) {
        throw 'bruh' // TODO: better error
    }

    // initialize the variable declaration node
    const vardec = {
        type: NodeType.VariableDeclaration,
        vartype: token.value,
        varname: nameTok.value
    } as IVardecNode;

    parser.current += 2;

    // check if there is also directly a value assigned to the variable
    const asgnTok = parser.currentToken;
    if (asgnTok.type === TokenType.OPERATOR && asgnTok.value === '=') {
        parser.current ++;
        const valueExpressionNode: IExpressionNode = parseExpression(parser, ';'); // Call the expression function
        vardec.varval = valueExpressionNode;
        parser.current += 1;
    }

    return vardec;
}

export const parseControlStructure : Walker = (parser: Parser): INode => {
    let node, next, originalCurrent;
    switch(parser.currentToken.value as Keyword) {
    case 'if':
        node = { type: NodeType.IfStmt } as IIfStmtNode; // declare an if statement node

        parser.current += 2; // skip if & starting parenthesis
        node.condition = parseExpression(parser, ')');
        parser.current ++;

        node.code = parser.walk() as ICodeBlockNode;
        originalCurrent = parser.current; 
        next = parser.walk();
        
        if (next.type === NodeType.ElseStmt) {
            node.else = (next as IElseStmtNode);
        } else {
            parser.current = originalCurrent;
        }
        return node;
    case 'elif':
        node = {
            type: NodeType.ElseStmt
        } as IElseStmtNode;

        const ifstmt = {
            type: NodeType.IfStmt
        } as IIfStmtNode;

        parser.current += 2; // skip elif & starting parenthesis
        ifstmt.condition = parseExpression(parser, ')');
        parser.current ++;
        ifstmt.code = parser.walk() as ICodeBlockNode;

        next = parser.walk();
        
        originalCurrent = parser.current; 
        if (next.type === NodeType.ElseStmt) {
            ifstmt.else = (next as IElseStmtNode);
        } else {
            parser.current = originalCurrent;
        }

        node.code = {
            type: NodeType.CodeBlock,
            nodes: [ifstmt]
        } as ICodeBlockNode;

        return node;
    case 'else':
        node = {
            type: NodeType.ElseStmt
        } as IElseStmtNode;
        parser.current++;
        next = parser.walk();
        if (!next.type) {
            throw SyntaxError.invalidToken('else', 'if statement or code block')
        }
        switch(next.type) {
        case NodeType.IfStmt:
            node.code = (next as IIfStmtNode);
            break;
        case NodeType.CodeBlock:
            node.code = (next as ICodeBlockNode);
            break;
        default:
            throw SyntaxError.invalidNode('else', 'if statement or code block', next.type)
        }
        return node;
    case 'while':
        node = {
            type: NodeType.WhileStmt
        } as IWhileStmtNode;
        parser.current += 2; // skip while & starting parenthesis
        node.condition = parseExpression(parser, ')');
        parser.current ++;
        node.code = parser.walk() as ICodeBlockNode;
        return node;
    case 'for':
        if (parser.next().type === TokenType.SPECIAL && parser.next().value === '(') {
            throw new UnimplementedError('ClassicForStmt');
        } else {
            node = {
                type: NodeType.ArrayForStmt
            } as IArrayForStmtNode;
            parser.current++; // skip the for
            node.valSymbol = parser.walk() as ISymbolNode; // get the symbol name
            parser.current++; // skip the in
            node.arr = parser.walk() as ISymbolNode | IValueNode; // get the array as a literal / symbol
            if (![NodeType.StringLiteral, NodeType.Array, NodeType.Symbol].includes(node.arr.type)) {
                throw SyntaxError.invalidNode('for ... in', 'string literal, array or symbol', node.arr.type);
            }
            node.code = parser.walk() as ICodeBlockNode; // get the code
            return node; // and we're done
        }
    default:
        throw SyntaxError.unsupportedToken(parser.currentToken);
    }
}

export const parseVariableAssignment : Walker = (parser: Parser): INode => {
    const varName = parser.currentToken;
    const asgnSymbol = parser.next();
    parser.current += 2;
    const varValue = parseExpression(parser, ';');
    
    if (!(varName.type === TokenType.SYMBOL && asgnSymbol.type === TokenType.OPERATOR && asgnSymbol.value === '=')) {
        if (varName.type !== TokenType.SYMBOL)
            throw SyntaxError.invalidToken('a type (inside a variable assignment structure)', 'operator', varName.type);
        if (asgnSymbol.type !== TokenType.OPERATOR)
            throw SyntaxError.invalidToken('variable name', 'operator', asgnSymbol.type);
        throw new UnimplementedError("Operators that aren't = inside variable assignment");
    }

    const varAsgn = {
        type: NodeType.VariableAssignment,
        varname: varName.value,
        varval: varValue
    } as IVarAssignNode;
    return varAsgn;
}

export const parseFunctionCall : Walker = (parser: Parser): INode => {
    let funcall = {
        type: NodeType.FunctionCall,
        name: parser.currentToken.value,
    } as IFunctionCallNode;
    
    // check if the next token is "(" (it has to be)
    let openParen = parser.next();
    
    parser.current += 2; // skip symbol name & starting parenthesis

    funcall.args = parseFunctionArguments(parser) as IFunctionArgumentsNode;
    
    parser.current++; // skip closing parenthesis
    return funcall;
}

export const parseFunctionArguments : Walker = (parser: Parser): IFunctionArgumentsNode => {
    let funcArgsNode = {
        type: NodeType.FunctionArguments,
        args: []
    } as IFunctionArgumentsNode;

    if (!(parser.currentToken.type === TokenType.SPECIAL && parser.currentToken.value === ')'))
    while(true) {
        const t = parseExpression(parser, ',', ')');
        funcArgsNode.args.push(t);
        if (parser.currentToken.type === TokenType.SPECIAL && [')', ';'].includes(parser.currentToken.value)) break;
        // skip the comma
        parser.current++;
    }
    return funcArgsNode;
}

export const parseSymbol : Walker = (parser: Parser): INode => {
    const token = parser.currentToken;
    parser.current++;
    return {
        type: NodeType.Symbol,
        name: token.value
    } as ISymbolNode;
}

export const parseOperator : Walker = (parser: Parser): INode => {
    const token = parser.currentToken;
    parser.current++;
    return {
        type: NodeType.Operator,
        operator: token.value
    } as IOperatorNode;
}

export const parseValue : Walker = (parser: Parser): INode => {
    const token = parser.currentToken;
    if (token.type === TokenType.NUMBER) {
        parser.current++;
        return {
            type: NodeType.NumberLiteral,
            value: token.value.includes(".") ? parseFloat(token.value) : parseInt(token.value)
        } as IValueNode;
    }
    if (token.type === TokenType.STRING) {
        parser.current++;
        return {
            type: NodeType.StringLiteral,
            // remove quotation marks
            value: token.value.slice(1, -1)
        } as IValueNode;
    }
    if (token.type === TokenType.BOOLEAN) {
        parser.current++;
        return {
            type: NodeType.Boolean,
            value: (token.value === 'true')
        } as IValueNode;
    }
    if (token.type === TokenType.FRACTION) {
        const parts = token.value.split('/').map(v => parseInt(v));
        parser.current++;
        return {
            type: NodeType.Fraction,
            value: new Fraction(parts[0], parts[1])
        } as IValueNode;
    }
    throw ParseError.unknown('something is wrong with the expression parser');
}

export const parseDotAccesses : Walker = (parser: Parser): IDotAccessNode => {
    return parseDotAccess(parser);
}

export const parseDotAccess = (parser: Parser, previousAccess?: IDotAccessNode): IDotAccessNode => {
    let n = {
        type: NodeType.DotAccess
    } as IDotAccessNode;
    if (previousAccess) {
        n.accessee = previousAccess;
    } else {
        if (parser.next().type === TokenType.SPECIAL && parser.currentToken.value === '(') { // if it's a function call
            n.accessee = (parseFunctionCall(parser) as IFunctionCallNode);
        } else if (parser.currentToken.type === TokenType.SYMBOL) {
            n.accessee = (parseSymbol(parser) as ISymbolNode);
        } else {
            n.accessee = parseExpression(parser, ".")
        }
    }
    parser.current ++; // skip the dot
    if (parser.next().type === TokenType.SPECIAL && parser.next().value === '(') { // if it's a function call
        n.prop = (parseFunctionCall(parser) as IFunctionCallNode);
    } else {
        n.prop = (parseSymbol(parser) as ISymbolNode);
    }
    if (parser.currentToken.type === TokenType.SPECIAL && parser.currentToken.value === '.') {
        n = parseDotAccess(parser, n)
    }
    return n;
}

export const parseArray : Walker = (parser: Parser): INode => {
    // skip the starting [ 
    parser.current++;
    let arrayElementsNode = {
        type: NodeType.UnevaluatedArray,
        elements: []
    } as IUnevaluatedArrayNode;

    if (!(parser.currentToken.type === TokenType.SPECIAL && parser.currentToken.value === ']'))
    while(true) {
        const el = parseExpression(parser, ',', ']');
        arrayElementsNode.elements.push(el);
        if (parser.currentToken.type === TokenType.SPECIAL && [']'].includes(parser.currentToken.value)) break;
        // skip the comma
        parser.current++;
    }
    // skip the "]"
    parser.current++;
    return arrayElementsNode;
}