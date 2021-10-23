import Evaluator from "./evaluator";
import Parser, { IVardecNode } from "./parser";
import Tokenizer from "./tokenizer";
import fs from "fs"

const c = fs.readFileSync("code.hj", "utf-8");

const a : Tokenizer = new Tokenizer(c);
const tokens = a.createTokens();
const p = new Parser(tokens);
const ast = p.parse();
const e : Evaluator = new Evaluator(ast);
e.evaluate();