export const TokenTypes = {
    FRACTION: /^[\s]*(?:-)?[0-9]+\/(?:-)?[0-9]+/,
    NUMBER  : /^[\s]*(?:-)?[0-9]+(?:\.[0-9]+)?/,
    STRING  : /^[\s]*\"(?:.*?)\"/,
    BOOLEAN : /^[\s]*(?:true|false)/,
    BUILTIN : /^[\s]*(?:frac|num|void|string|frac|bool|array)\s/,
    USRTYPES: /^[\s]*(?:class|function)\s/,
    KEYWORD : /^[\s]*(if|else|elif|while|for|in|return)\s/,
    SYMBOL  : /^[\s]*[A-Za-z_][\w]*/,
    OPERATOR: /^[\s]*(?:(?:==|<=|<|>=|>|!=)|(?:[+\-\/*]?=)|(?:[+\-\*]{2})|(?:[+\-\/*\=]))/,
    SPECIAL : /^[\s]*(?:[\{\}\(\)\[\];:]|=>|\.\.\.|\.)/,
    OTHER   : /^[\s]*(?:\,)/
};

export type BuiltIn  = 'frac' | 'num' | 'void' | 'string' | 'frac' | 'bool' | 'array';
export type UsrTypes  = 'class' | 'function';
export type Keyword  = 'if' | 'else' | 'elif' | 'while' | 'for' | 'in' | 'return';
export type Operator = '+' | '-' | '*' | '/' | '**' | '+=' | '-=' | '*=' | '/=' | '++' | '--' | '==' | '<' | '<=' | '>' | '>=' | '!=';

export function getTokenTypeName(i: number) { return Object.values(TokenType)[i]; }
export function checkToken(token: Token, type: TokenType, value?: string) { return token.type === type && (value ? token.value === value : true); }

export enum TokenType {
    FRACTION, NUMBER, STRING, BOOLEAN, BUILTIN, USRTYPES, KEYWORD, SYMBOL, OPERATOR, SPECIAL, OTHER
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