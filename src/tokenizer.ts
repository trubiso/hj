import chalk from "chalk";
import Pos from "./pos";
import Token, { TokenTypes } from "./token";

export default class Tokenizer {
    public code: string;
    public pos: Pos;
    public slice: string;

    private removeCommentsFromCode(code: string) {
        const s = code.split('\n').map(line => { // step 1 is to remove one-line comments
            let isOnAString = false;
            let ind = line.length;
            // go through each character in the line
            line.split('').forEach((c, i) => {
                // check if it's a quotation mark => update this.isOnAString
                if (c === "\"") isOnAString = !isOnAString;
                // search for single line comments
                if (!isOnAString && line[i - 1] && line[i - 1] === '/' && c === '/') ind = i - 1;
            });
            return line.slice(0, ind);
        }).join(' ');
        let isOnAString  = false;
        let isCommenting = false;
        let o = "";
        for (let i = 0 ; i < s.length ; i ++) {
            const c = s[i];
            if (c === "\"" && !isCommenting) isOnAString = !isOnAString;
            if (c === '/' && s[i + 1] === '*' && !isOnAString && !isCommenting
            ||  s[i - 2] === '*' && s[i - 1] === '/' && !isOnAString &&  isCommenting) isCommenting = !isCommenting;
            if (!isCommenting) o += s[i];
        }
        return o;
    }

    constructor(code: string) {
        this.code = this.removeCommentsFromCode(code);
        this.pos = new Pos(0, 0, 0, code);
        this.slice = this.code + ""; // make sure it's not a reference, even though i don't know if it could be
    }

    public advance(n: number) {
        this.pos.advance(n); // advance the position
        this.slice = this.code.slice(this.pos.idx); // remove characters until current position
        while ([' ', '\t', ' ', '\n'].includes(this.slice[0])) this.advance(1); // skip whitespace, it won't help us tokenize
    }

    public createTokens() {
        const startTime = Date.now();
        process.stdout.write(chalk.yellow("Tokenizing code...")); // i use process.stdout.write here instead of console.log to be able to remove the line later

        const tokens : Token[] = [];

        while (this.slice) { // loop until the slice is empty
            let token = null; // set the token to null as first, it will help us check whether there was a match or not
            
            for (let i = 0 ; i < Object.keys(TokenTypes).length ; i ++) {
                const tokenAttempt = Object.values(TokenTypes)[i].exec(this.slice); // execute the regexp for the token type on the slice of code // hm
                if (tokenAttempt === null) continue; // skip to the next token type if this one doesn't match
                
                token = new Token(i, tokenAttempt[0]/* first match is the one we care about */.trim()); // make a token if it *does* match
                break; // & break out of the loop
            }

            if (token === null) { // if there were no token type matches it's invalid
                throw `Invalid token at position ${this.pos.toString()}`;
            }

            tokens.push(token as Token); // add the token (typecast because now we know for certain it *is* a token)
            this.advance((token as Token).value.length); // & advance to the next token, rinse and repeat
        }

        process.stdout.write("\r\x1b[K"); // remove last line and move cursor to beginning
        console.log(chalk.green(`Successfully tokenized code. `) + chalk.grey(`(${Date.now() - startTime} ms)`));

        return tokens;
    }
}