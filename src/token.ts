export const TokenTypes = {
    NUMBER  : /^[\s]*(?:-)?[0-9]+(?:\.[0-9]+)?/,
    STRING  : /^[\s]*\"(?:.*)\"/,
    BOOLEAN : /^[\s]*(?:true|false)/,
    BUILTIN : /^[\s]*(?:int|void|string|char|frac|float|double|bool)/,
    KEYWORD : /^[\s]*(?:return|function|class)/,
    SYMBOL  : /^[\s]*[A-Za-z_][\w]*/,
    OPERATOR: /^[\s]*(?:(?:[+\-\/*]?=)|(?:[+\-]{2})|(?:[+\-\/*\=]))/,
    SPECIAL : /^[\s]*(?:[\{\}\(\);:]|=>)/,/*
    OTHER*/
};

export type BuiltIn  = 'int' | 'void' | 'string' | 'char' | 'frac' | 'float' | 'double' | 'bool';
export type Keyword  = 'return' | 'function' | 'class';
export type Operator = '+' | '-' | '*' | '/' | '+=' | '-=' | '*=' | '/=' | '++' | '--';

export function getTokenTypeName(i: number) { return Object.values(TokenType)[i]; }

export enum TokenType {
    NUMBER, STRING, BOOLEAN, BUILTIN, KEYWORD, SYMBOL, OPERATOR, SPECIAL
}

export default class Token {
    public type: TokenType;
    public value: string;

    constructor(type: TokenType, value: string) {
        this.type = type;
        this.value = value;
    }

    public toString() : string {
        return `<${Object.keys(TokenTypes)[this.type].slice(0,2)}:${this.value}>`
    }
};