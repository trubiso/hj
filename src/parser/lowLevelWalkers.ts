import Parser from './parser'
import Token, { TokenType, getTokenTypeName, BuiltIn, Keyword, checkToken } from '../token'
import { ParseError, SyntaxError, UnimplementedError } from '../errors'
import { Walker } from './walker';
import { parseExpression } from './parseFunctions';
import { INode, NodeType, ICodeBlockNode, IVardecNode, IExpressionNode, IIfStmtNode, IElseStmtNode, getNodeTypeName, IWhileStmtNode, IVarAssignNode, IFunctionCallNode, IValueNode, IOperatorNode, ISymbolNode, IFunctionArgumentsNode, IUnevaluatedArrayNode, IArrayForStmtNode, IDotAccessNode, IArrayAccessNode } from './nodes';
import Fraction from '../dataclasses/fraction';
import { expressionWalker } from './expressionWalker';

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

        if (checkToken(parser.next(), TokenType.KEYWORD, 'else')) {
            next = parser.walk();
            node.else = (next as IElseStmtNode);
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
        if (!checkToken(parser.next(3), TokenType.KEYWORD, 'in')) {
            throw new UnimplementedError('ClassicForStmt');
        } else {
            node = {
                type: NodeType.ArrayForStmt
            } as IArrayForStmtNode;
            parser.current += 2; // skip the for (
            node.valSymbol = expressionWalker(parser) as ISymbolNode; // get the symbol name
            parser.current ++; // skip the in
            node.arr = parseExpression(parser, ')'); // get the thing we iterate over
            parser.current ++; // skip closing parenthesis
            node.code = parser.walk() as ICodeBlockNode; // get the code
            return node; // and we're done
        }
    default:
        throw SyntaxError.unsupportedToken(parser.currentToken);
    }
}

export const parseVariableAssignment : Walker = (parser: Parser): INode => {
    const varName = parser.currentToken; // we start at a symbol
    const varAsgn = {
        type: NodeType.VariableAssignment,
        varname: varName.value
    } as IVarAssignNode;

    let asgnSymbol = parser.next();
    if (checkToken(parser.next(), TokenType.SPECIAL, '[')) {
        parser.current += 2; // skip name, [
        varAsgn.idx = parseExpression(parser, ']');
        parser.current ++; // skip ]
        asgnSymbol = parser.currentToken;
        parser.current ++; // skip operator
    } else parser.current += 2; // skip normally if not
    const varValue = parseExpression(parser, ';');
    
    if (!(varName.type === TokenType.SYMBOL && checkToken(asgnSymbol, TokenType.OPERATOR, '='))) {
        if (varName.type !== TokenType.SYMBOL)
            throw SyntaxError.invalidToken('a type (inside a variable assignment structure)', 'variable name', varName.type);
        if (asgnSymbol.type !== TokenType.OPERATOR)
            throw SyntaxError.invalidToken('variable name', 'operator', asgnSymbol.type);
        throw new UnimplementedError("Operators that aren't = inside variable assignment");
    }

    varAsgn.varval = varValue;
    return varAsgn;
}

export const parseFunctionCall = (parser: Parser, calledFromArr = false): INode => {
    let funcall = {
        type: NodeType.FunctionCall,
        name: parser.currentToken.value,
    } as IFunctionCallNode;
    
    const ogCurrent = parser.current;

    // check if the next token is "(" (it has to be)
    let openParen = parser.next();
    
    parser.current += 2; // skip symbol name & starting parenthesis

    funcall.args = parseFunctionArguments(parser) as IFunctionArgumentsNode;
    
    parser.current++; // skip closing parenthesis
    if (parser.currentToken && checkToken(parser.currentToken, TokenType.SPECIAL, '[') && !calledFromArr) {
        parser.current = ogCurrent;
        return parseArrayAccess(parser);
    }
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

export const parseArrayAccess : Walker = (parser: Parser): INode => {
    const n = { // this comment is useless
        type: NodeType.ArrayAccess
    } as IArrayAccessNode;
    if (parser.next().type === TokenType.SPECIAL && parser.next().value === '(') { // we're accessing a function call
        n.accessee = parseFunctionCall(parser, true) as IFunctionCallNode;
    } else { // we're accessing a symbol
        n.accessee = parseSymbol(parser) as ISymbolNode;
    }
    parser.current ++; // skip starting [
    if (!checkToken(parser.currentToken, TokenType.SPECIAL, ':')) // because its optional
        n.start = parseExpression(parser, ':', ']'); // take start
    if (!n.start?.expr.length) n.start = undefined;
    //else parser.current++; // just skip it if not lol
    parser.current ++; // skip either : or ]
    if (checkToken(parser.next(-1), TokenType.SPECIAL, ']')) return n; // if we skipped ], we can return
    n.hasFirstSep = true;
    if (!checkToken(parser.currentToken, TokenType.SPECIAL, ':')) // because its optional
        n.end = parseExpression(parser, ':', ']'); // if we didn't return, we skipped over a :, so lets get the end
    if (!n.end?.expr.length) n.end = undefined;
    //else parser.current++; // read the last comment about this
    parser.current ++; // skip either : or ]
    if (checkToken(parser.next(-1), TokenType.SPECIAL, ']')) return n; // if we skipped ], we can return
    n.step = parseExpression(parser, ']'); // if we got here the last thing we can have is step and its mandatory
    parser.current ++; // skip ]
    return n; // at the end we always return :D
}