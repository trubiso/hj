import chalk from "chalk";
import Pos from "./pos";
import Token, { TokenTypes } from "./token";

export default class Tokenizer {
    public code: string;
    public pos: Pos;
    public slice: string;

    constructor(code: string) {
        this.code = code;
        this.pos = new Pos(0, 0, 0, code);
        this.slice = code;
    }

    public advance(n: number) {
        this.pos.advance(n);
        this.slice = this.code.slice(this.pos.idx);
        while ([' ', '\t', ' '].includes(this.slice[0])) this.advance(1);
    }

    public createTokens() {
        const st = Date.now();
        process.stdout.write(chalk.yellow("Tokenizing code..."));

        const tokens : Token[] = [];

        while (this.slice) {
            var token = null;
            
            // add code here...
            for (const i of [...Array(Object.keys(TokenTypes).length).keys()]) {
                const e = Object.values(TokenTypes)[i].exec(this.slice);
                if (e === null) continue;
                
                token = new Token(i, e[0].trim());
                break;
            }
            if (token === null) {
                throw `Invalid token at position ${this.pos.toString()}`
            }
            token = token as Token;
            tokens.push(token);
            this.advance(token.value.length);
        }

        process.stdout.write("\r\x1b[K");
        console.log(chalk.green(`Successfully tokenized code. `) + chalk.grey(`(${Date.now() - st} ms)`));

        return tokens;
    }
}