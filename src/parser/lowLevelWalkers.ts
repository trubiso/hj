import Parser from './parser'
import Token, { TokenType, getTokenTypeName, BuiltIn, Keyword } from '../token'
import { ParseError } from '../errors'
import { Walker } from './walker';
import { parseExpression } from './parseFunctions';
import { INode, NodeType, ICodeBlockNode, IVardecNode, IExpressionNode, IIfStmtNode, IElseStmtNode, getNodeTypeName, IWhileStmtNode, IVarAssignNode, IFunctionCallNode, IValueNode, IOperatorNode, ISymbolNode, IFunctionArgumentsNode } from './nodes';
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
        next = parser.walk();
        
        originalCurrent = parser.current; 
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
            throw 'You have to put at least *something* after the else block'
        }
        switch(next.type) {
        case NodeType.IfStmt:
            node.code = (next as IIfStmtNode);
            break;
        case NodeType.CodeBlock:
            node.code = (next as ICodeBlockNode);
            break;
        default:
            throw `You can't put a token with the type ${getNodeTypeName(next.type)} after an else!`;
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
    default:
        throw `Unsupported keyword: ${parser.currentToken.value}`;
    }
}

export const parseVariableAssignment : Walker = (parser: Parser): INode => {
    const varName = parser.currentToken;
    const asgnSymbol = parser.next();
    parser.current += 2;
    const varValue = parseExpression(parser, ';');
    
    if (!(varName.type === TokenType.SYMBOL && asgnSymbol.type === TokenType.OPERATOR && asgnSymbol.value === '=')) {
        throw `Invalid syntax for variable assignment (perhaps you did +=, dw, it'll be added later)`;
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
    if (!(openParen.type === TokenType.SPECIAL && openParen.value === "(")) {
        throw 'bruh' // TODO: better error
    }
    parser.current += 2; // skip symbol name & starting parenthesis

    funcall.args = parseFunctionArguments(parser) as IFunctionArgumentsNode;
    
    parser.current++; // skip closing parenthesis (FIXME: this doesnt always do it for some reason, perhaps with the revision it will)
    return funcall;
}

export const parseFunctionArguments : Walker = (parser: Parser): IFunctionArgumentsNode => {
    let funcArgsNode = {
        type: NodeType.FunctionArguments,
        args: []
    } as IFunctionArgumentsNode;

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
    throw 'Hey this shouldn\'t happen, something is wrong with the expression parser';
}