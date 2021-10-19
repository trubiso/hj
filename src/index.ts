import Evaluator from "./evaluator";
import Parser, { IVardecNode } from "./parser";
import Tokenizer from "./tokenizer";

//const a : Tokenizer = new Tokenizer("bool helo = false; int x = 5; int y = 10; int z = (3 + x - y); int r = x; int a = 1045; int f = (x + y + z + r + a); print(f);")
const a : Tokenizer = new Tokenizer("int x = (3 + (5 - 4 + (3 * 2) * 7 - 10)); print(x);");
const tokens = a.createTokens();
const p = new Parser(tokens);
const ast = p.parse();
const e : Evaluator = new Evaluator(ast);
e.evaluate();