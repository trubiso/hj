import chalk from "chalk";
import { IVar } from "./evaluator";
import { ISymbolNode, IFunctionCallNode, IVardecNode, INode, getNodeTypeName, NodeType } from "./parser/nodes";
import Pos from "./pos";
import Token, { getTokenTypeName, TokenType } from "./token";

export class TokenError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[TokenError] ") + message);
    }

    static invalidToken(pos: Pos) {
        return new TokenError(`Invalid token at position ${pos.toString()}`);
    }
}

export class SyntaxError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[SyntaxError] ") + message);
    }

    static invalidToken(currentToken: string, expectedToken: string, givenToken?: TokenType) {
        return new SyntaxError(`Expected ${expectedToken} after ${currentToken}, got ${givenToken ? getTokenTypeName(givenToken) : "none"} instead.`);
    }

    static invalidNode(currentNode: string, expectedNode: string, givenNode?: NodeType) {
        return new SyntaxError(`Expected ${expectedNode} after ${currentNode}, got ${givenNode ? getNodeTypeName(givenNode) : "none"} instead.`);
    }

    static unsupportedToken(token: Token) {
        return new SyntaxError(`Unsupported ${getTokenTypeName(token.type)}: ${token.value}`);
    }
}

export class ParseError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[ParseError] ") + message);
    }

    static invalidToken(context: string, token: Token) {
        return new ParseError(`Invalid token type for context \'${context}\': ${getTokenTypeName(token.type)}`)
    }

    static unknown(additional: string) {
        return new ParseError(`An unknown error occurred - ${additional}`);
    }
}

export class TypeError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[TypeError] ") + message);
    }
    
    static xNotFound(x: string, v?: IVar[]) {
        return new TypeError(chalk.redBright(x) + (v ? chalk.grey(` (current symbols: ${v.map(b => b.name).join(', ')})`) : ""))
    }

    static symbolNotFound(n: string, v: IVar[]) {
        return this.xNotFound(`symbol ${n} not found`, v);
    }

    static functionNotFound(f: IFunctionCallNode) {
        return this.xNotFound(`function ${f.name} not found`);
    }

    static vardecTypeCheckError(n: IVardecNode) {
        return new TypeError(`Expected value of ${n.varname} (${n.varval}) to be a ${n.vartype}; got ${typeof n.varval} instead.`);
    }
}

export class EvaluationError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[EvaluationError] ") + message);
    }

    static invalidProgramStructure(n: INode) {
        return new EvaluationError(`Invalid program structure (a command has to be a variable declaration or a function call, but it is ${getNodeTypeName(n.type)}).`);
    }
}

export class UnimplementedError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[UnimplementedError] ") + message);
    }
}