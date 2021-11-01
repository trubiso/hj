export const TokenTypes = {
    FRACTION: /^[\s]*(?:-)?[0-9]+\/(?:-)?[0-9]+/,
    NUMBER  : /^[\s]*(?:-)?[0-9]+(?:\.[0-9]+)?/,
    STRING  : /^[\s]*\"(?:.*?)\"/,
    BOOLEAN : /^[\s]*(?:true|false)/,
    BUILTIN : /^[\s]*(?:frac|num|void|string|frac|bool|array)\s/,
    KEYWORD : /^[\s]*(if|else|elif|while|for|in|function|return|class)\s/,
    SYMBOL  : /^[\s]*[A-Za-z_][\w]*/,
    SPECIAL : /^[\s]*(?:[\{\}\(\)\[\];:]|=>|\.\.\.|\.)/,
    OPERATOR: /^[\s]*(?:(?:==|<=|<|>=|>|!=)|(?:(?:\*{2}|\+|\-|\/|\*)?=)|(?:\+\+|\-\-)|(?:\*\*|[+\-\/*\=]))/,
    OTHER   : /^[\s]*(?:\,)/
};

export type BuiltIn  = 'frac' | 'num' | 'void' | 'string' | 'frac' | 'bool' | 'array';
export type Keyword  = 'if' | 'else' | 'elif' | 'while' | 'for' | 'in' | 'function' | 'return' | 'class';
export type Operator = '+' | '-' | '*' | '/' | '**' | '+=' | '-=' | '*=' | '/=' | '**=' | '++' | '--' | '==' | '<' | '<=' | '>' | '>=' | '!=';

export function getTokenTypeName(i: number) { return Object.values(TokenType)[i]; }
export function checkToken(token: Token, type: TokenType, value?: string) { return token.type === type && (value ? token.value === value : true); }

export enum TokenType {
    FRACTION, NUMBER, STRING, BOOLEAN, BUILTIN, KEYWORD, SYMBOL, SPECIAL, OPERATOR, OTHER
}

export default class Token {
    public type: TokenType;
    public value: string;

    constructor(type: TokenType, value: string) {
        this.type = type;
        this.value = value;
    }

    public toString() : string {
        return `<${Object.keys(TokenTypes)[this.type].slice(0,2)}:${this.value}>`;
    }
};