import Token, { BuiltIn, getTokenTypeName, Operator, TokenType } from "../token";
import chalk from "chalk";
import Fraction from "../dataclasses/fraction";
import { ICodeBlockNode, ICommaNode, IExpressionNode, IFunctionCallNode, INode, IOperatorNode, ISymbolNode, ITopNode, IValueNode, NodeType } from "./nodes";
import { defaultWalker } from "./defaultWalker";

export enum WalkContext {
    Default, Expression
}

export default class Parser {
    public tokens: Token[];
    public current: number;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.current = 0;
    }

    /**
     * Gets the next token by a specific factor
     * 
     * @param factor The number of tokens ahead / behind, defaults to 1.
     * @returns The token in the index `this.current + factor`
     */
    public next(factor = 1) {
        return this.tokens[this.current + factor];
    }

    public get currentToken() { return this.tokens[this.current]; }

    /**
     * Gives an array of the tokens until a closing parenthesis.
     * The starting index (defaults to `this.current`) should store the index of the starting parenthesis for the search.
     * 
     * @argument skipPast Optional argument that defines whether `this.current` gets set to the index of the closing parenthesis. Defaults to `false`.
     * @argument tkSlice Optional argument to provide a slice of tokens where the search will be done. If it is not provided, it defaults to `this.tokens`
     * @argument stidx Optional argument to override the starting index.
     */
    public tokensUntilParen(skipPast = false, tkSlice?: Token[], stidx?: number) : Token[] { // as a side effect makes this.current higher
        let l = 0; /* parenthesis level - useful for nested parentheses */
        let i = (stidx ?? this.current) + 1; /* skip starting parenthesis */
        const tk = tkSlice ?? this.tokens; /* slices will help later a lot */
        for (; i < tk.length ; i ++) {
            if (tk[i].type === TokenType.SPECIAL && tk[i].value === '(') l ++;
            if (tk[i].type === TokenType.SPECIAL && tk[i].value === ')') l --;
            if (l === -1) break; /* closing parenthesis for starting parenthesis */
        }
        if (skipPast) this.current = i;
        return tk.slice(0, i); /* useful slice */
    }

    /**
     * Gives a number of the index of the closing parenthesis.
     * The starting index (defaults to `this.current`) should store the index of the starting parenthesis for the search.
     * 
     * @argument tkSlice Optional argument to provide a slice of tokens where the search will be done. If it is not provided, it defaults to `this.tokens`
     * @argument stidx Optional argument to override the starting index.
     */
    private parenIdx(tkSlice?: Token[], stidx?: number) : number { // as a side effect makes this.current higher
        let l = 0; /* parenthesis level - useful for nested parentheses */
        let i = (stidx ?? this.current) + 1; /* skip starting parenthesis */
        const tk = tkSlice ?? this.tokens; /* slices will help later a lot */
        for (; i < tk.length ; i ++) {
            if (tk[i].type === TokenType.SPECIAL && tk[i].value === '(') l ++;
            if (tk[i].type === TokenType.SPECIAL && tk[i].value === ')') l --;
            if (l === -1) break; /* closing parenthesis for starting parenthesis */
        }
        return i;
    }

    /**
     * Gives an array of the tokens until the given delimiter.
     * The starting index (defaults to `this.current`) should store the index of the starting token for the search.
     * 
     * @argument delim The delimiter to search for in the string.
     * @argument skipPast Optional argument that defines whether `this.current` gets set to the index of the delimiter. Defaults to `false`.
     * @argument tkSlice Optional argument to provide a slice of tokens where the search will be done. If it is not provided, it defaults to `this.tokens`
     * @argument stidx Optional argument to override the starting index.
     */
    private tokensUntilDelim(delim: string, skipPast = false, tkSlice: Token[] = this.tokens, stidx: number = this.current) : Token[] {
        let i = stidx;
        const tk = tkSlice;
        for (; i < tk.length ; i ++) {
            if (tk[i].type === TokenType.SPECIAL && tk[i].value === delim) break;
        }
        if (skipPast) this.current = i;
        return tk.slice(stidx, i); /* useful slice */
    }

    /**
     * Gives the index of the next ocurrence of the given delimiter.
     * The starting index (defaults to `this.current`) should store the index of the starting token for the search.
     * 
     * @argument delim The delimiter to search for in the string.
     * @argument skipPast Optional argument that defines whether `this.current` gets set to the index of the delimiter. Defaults to `false`.
     * @argument tkSlice Optional argument to provide a slice of tokens where the search will be done. If it is not provided, it defaults to `this.tokens`
     * @argument stidx Optional argument to override the starting index.
     */
     private delimIdx(delim: string, tkSlice?: Token[], stidx?: number) : number {
        let i = (stidx ?? this.current);
        const tk = tkSlice ?? this.tokens;
        for (; i < tk.length ; i ++) {
            if (tk[i].type === TokenType.SPECIAL && tk[i].value === delim) break;
        }
        return i;
    }

    // Converts a list of tokens to a list of nodes
    private expressionToNode(expr: Token[]) : IExpressionNode {
        const theMagic = (slice: Token[]) : IExpressionNode => { // i do not know what to name this function
            const originalIndex = this.current;
            let workingIndex = originalIndex;
            const arr: INode[] = [];
            // go through each token in the slice
            for(; workingIndex < slice.length ; workingIndex++) {
                // if the current token is a starting parenthesis, recall the "theMagic" function with the slice inside of the parentheses
                if (slice[workingIndex].type === TokenType.SPECIAL && slice[workingIndex].value === '(') {
                    const t = this.tokensUntilParen(false, slice, workingIndex);
                    // set this.current to the starting parenthesis index for "theMagic" to work
                    this.current = workingIndex + 1;
                    arr.push(theMagic(t));
                    // and reset it
                    this.current = originalIndex;
                    // continue working after the closing parenthesis
                    workingIndex = this.parenIdx(slice, workingIndex); // reminder for future self: this (this.parenIdx) does NOT (under ANY circumstances) need to be added to pC (starting index). i've been debugging this for a hour or something and that was the cause AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                } else {
                    // set this.current to workingIndex for the sake of the walk function (yes this is pretty messy)
                    this.current = workingIndex;
                    arr.push(this.walk());
                    workingIndex = this.current - 1;
                    // and reset it
                    this.current = originalIndex;
                }
            }
            return {
                type: NodeType.Expression,
                expr: arr
            } as IExpressionNode;
        }
        return theMagic(expr).expr[0] as IExpressionNode;
    }

    private getExpressionNode(): IExpressionNode {
        const tk = this.tokens;
        let i = this.current;
        // if there are parentheses convert the tokens inside of them to a node
        if (tk[i].type === TokenType.SPECIAL && tk[i].value === '(') {
            const tokens = this.tokensUntilParen();
            const expressionNode = this.expressionToNode(tokens);
            this.current = this.parenIdx();
            return expressionNode;
        } else {
            // life hack (DO NOT TRY) (this code is garbage)
            // if there are no parentheses just create them lol
            this.tokens = [...this.tokens.slice(0, this.current), new Token(TokenType.SPECIAL, '('), // this IS going to break
            ...this.tokens.slice(this.current, this.delimIdx(';')), new Token(TokenType.SPECIAL, ')'),
            ...this.tokens.slice(this.delimIdx(';'))];

            const e = this.getExpressionNode(); // i hope this doesnt make it recursive (spoiler: it did at some point but i fix)
            this.current++;
            return e;
        }
        /*if (tk[i].value === '(') {
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
        }*/
        // the above code is garbage but i keep it just in case something breaks and i have to read it again (ew) (I hope not)
    }

    public walk() : INode {
        return defaultWalker(this);
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
            console.log(this.current);
            const n = this.walk();
            ast.body.push(n);
        }

        process.stdout.write("\r\x1b[K");
        console.log(chalk.green("Parsed tokens successfully. ") + chalk.grey(`(${Date.now() - st} ms)`));

        return ast;
    }
}