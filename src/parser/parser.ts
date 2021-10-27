import Token, { TokenType } from "../token";
import chalk from "chalk";
import { INode, ITopNode, NodeType } from "./nodes";
import { defaultWalker } from "./defaultWalker";


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
            const n = this.walk();
            ast.body.push(n);
        }

        process.stdout.write("\r\x1b[K");
        console.log(chalk.green("Parsed tokens successfully. ") + chalk.grey(`(${Date.now() - st} ms)`));

        return ast;
    }
}