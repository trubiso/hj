import Token, { BuiltIn, getTokenTypeName, Operator, TokenType } from "./token";
import chalk from "chalk";

export enum NodeType {
    Program, NumberLiteral, StringLiteral, Symbol, VariableDeclaration, Expression, FunctionCall, UnparsedOperator, UnparsedSymbol
}

export interface INode {
    type: NodeType;
}

export interface IValueNode extends INode {
    value: any;
}

export interface ITopNode extends INode {
    body: INode[];
}

export interface IVardecNode extends INode {
    vartype: BuiltIn;
    varval: any | INode;
    varname: string;
}

export interface ISymbolNode extends INode {
    name: string;
}

export interface IOperatorNode extends INode {
    operator: Operator;
}

export interface IExpressionNode extends INode {
    expr: INode[]
}

export interface IFunctionCallNode extends INode {
    name: string;
    args: INode[];
}

export default class Parser {
    public tokens: Token[];
    private current: number;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.current = 0;
    }

    private walk() : INode /* TODO: remove union with undefined */ {
        let token = this.tokens[this.current];
        if (token.type === TokenType.NUMBER) {
            this.current++;
            return {
                type: NodeType.NumberLiteral,
                value: token.value
            } as IValueNode;
        }
        if (token.type === TokenType.STRING) {
            this.current++;
            return {
                type: NodeType.StringLiteral,
                value: token.value
            } as IValueNode;
        }
        if (token.type === TokenType.BUILTIN) {
            const nameTok = this.tokens[this.current + 1];
            const asgnTok = this.tokens[this.current + 2];
            const valTok  = this.tokens[this.current + 3];
            if (nameTok.type === TokenType.SYMBOL && asgnTok.type === TokenType.OPERATOR && asgnTok.value === '=') {
                const vardec = {
                    type: NodeType.VariableDeclaration,
                    vartype: token.value as BuiltIn,
                    varname: nameTok.value
                } as IVardecNode;
                let valTokVal: any = valTok.value;
                switch(valTok.type) {
                case TokenType.BUILTIN:
                case TokenType.KEYWORD:
                case TokenType.OPERATOR:
                    throw `Tried to parse assignment "${token.value} ${nameTok.value} = ${valTok.value}" but ${valTok.value} is of type ${getTokenTypeName(valTok.type)} (unsupported).`
                // @ts-ignore
                case TokenType.NUMBER:
                    if (valTok.value.includes(".")) valTokVal = parseFloat(valTok.value);
                    else valTokVal = parseInt(valTok.value);
                case TokenType.STRING:
                    vardec.varval = valTokVal;
                    break;
                case TokenType.BOOLEAN:
                    if (valTok.value === 'true') vardec.varval = true;
                    else vardec.varval = false;
                    break;
                case TokenType.SYMBOL:
                    vardec.varval = {
                        type: NodeType.Symbol,
                        name: valTok.value
                    } as ISymbolNode;
                    break;
                case TokenType.SPECIAL:
                    if (valTok.value === '(') {
                        this.current += 4;
                        let exprnode = {
                            type: NodeType.Expression,
                            expr: []
                        } as IExpressionNode;
                        while(this.tokens[this.current].type !== TokenType.SPECIAL) {
                            exprnode.expr.push(this.walk());
                        }
                        vardec.varval = exprnode;
                        this.current -= 3; // rewind because later we're adding 4 and 4-3 is 1 which skips the closing parenthesis
                    } else {
                        throw `Unexpected ${valTok.value} in assignment (${token.value} ${nameTok.value} = ${valTok.value})`;
                    }
                    break;
                }
                this.current += 4;
                return vardec;
            }
            return {
                type: NodeType.StringLiteral,
                value: token.value
            } as IValueNode; //TODO: this shouldn't exist, i'm just trying to make the throw hapy
        }
        if (token.type === TokenType.OPERATOR) { // THIS HAS TO BE ONE OF THE LAST CHECKS, PLEASE TRUBISO REMEMBER
            this.current++;
            return {
                type: NodeType.UnparsedOperator,
                operator: token.value
            } as IOperatorNode;
        }
        if (token.type === TokenType.SYMBOL) { // THIS HAS TO BE ONE OF THE LAST CHECKS, PLEASE TRUBISO REMEMBER
            this.current++;
            if (this.tokens[this.current].type === TokenType.SPECIAL) { // x{} or x()
                if (this.tokens[this.current].value === '(') { // function call
                    let funcall = {
                        type: NodeType.FunctionCall,
                        name: token.value
                    } as IFunctionCallNode;
                    this.current++;
                    funcall.args = [this.walk()]; // TODO: support multiple argument functions / expression input into functions
                    this.current++; // skip closing parenthesis
                    return funcall;
                }
            }
            return {
                type: NodeType.UnparsedSymbol,
                name: token.value
            } as ISymbolNode;
        }
        throw `Cannot parse token of type ${getTokenTypeName(token.type)}`;
    }

    public parse() : ITopNode {
        const st = Date.now();
        this.current = 0;
        let ast = {
            type: NodeType.Program,
            body: []
        } as ITopNode;

        process.stdout.write(chalk.yellow("Parsing tokens..."));

        while (this.current < this.tokens.length) {
            if (this.tokens[this.current].type === TokenType.SPECIAL && this.tokens[this.current].value === ';') {
                this.current++;
                continue;
            }
            ast.body.push(this.walk());
        }

        process.stdout.write("\r\x1b[K");
        console.log(chalk.green("Parsed tokens successfully. ") + chalk.grey(`(${Date.now() - st} ms)`));

        return ast;
    }
}