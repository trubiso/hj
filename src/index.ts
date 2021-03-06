import Evaluator from "./evaluator";
import Parser from "./parser/parser";
import Tokenizer from "./tokenizer";
import fs from "fs"

const code = fs.readFileSync("code.hj", "utf-8");

const tokenizer : Tokenizer = new Tokenizer(code);
const tokens = tokenizer.createTokens();
const parser = new Parser(tokens);
const ast = parser.parse();
const evaluator : Evaluator = new Evaluator(ast);
// evaluator.prettyPrint();
evaluator.evaluate();