export const TokenTypes = {
    NUMBER  : /^[\s]*(?:-)?[0-9]+(?:\.[0-9]+)?/,
    STRING  : /^[\s]*\"(?:.*?)\"/,
    BOOLEAN : /^[\s]*(?:true|false)/,
    BUILTIN : /^[\s]*(?:num|void|string|frac|bool)\s/,
    USRTYPES: /^[\s]*(?:class|function)\s/,
    KEYWORD : /^[\s]*(if|while|for|return)\s/,
    SYMBOL  : /^[\s]*[A-Za-z_][\w]*/,
    OPERATOR: /^[\s]*(?:(?:[+\-\/*]?=)|(?:[+\-\*]{2})|(?:[+\-\/*\=]))/,
    SPECIAL : /^[\s]*(?:[\{\}\(\);:]|=>)/,
    OTHER   : /^[\s]*(?:\,)/
};

export type BuiltIn  = 'num' | 'void' | 'string' | 'frac' | 'bool';
export type UsrTypes  = 'class' | 'function';
export type Keyword  = 'if' | 'while' | 'for' | 'return';
export type Operator = '+' | '-' | '*' | '/' | '**' | '+=' | '-=' | '*=' | '/=' | '++' | '--';

export function getTokenTypeName(i: number) { return Object.values(TokenType)[i]; }

export enum TokenType {
    NUMBER, STRING, BOOLEAN, BUILTIN, USRTYPES, KEYWORD, SYMBOL, OPERATOR, SPECIAL, OTHER
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