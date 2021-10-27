import { INode } from "./nodes";
import Parser from "./parser";

export type Walker = (parser: Parser) => INode