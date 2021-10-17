import Evaluator from "./evaluator";
import Parser, { IVardecNode } from "./parser";
import Tokenizer from "./tokenizer";

const a : Tokenizer = new Tokenizer("bool helo = false; int x = 5; int y = 10; int z = (3 + x - y); int r = x; int a = 1045;"/* print(x + y);"*/)
const tokens = a.createTokens();
const p = new Parser(tokens);
console.log(tokens.map(v => v.toString()).join(''));
const ast = p.parse();
console.log(ast);
console.log((ast.body[3] as IVardecNode).varval);
console.log((ast.body[4] as IVardecNode).varval);
const e : Evaluator = new Evaluator(ast);
e.evaluate();