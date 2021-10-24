import chalk from "chalk";
import { IVar } from "./evaluator";
import { getNodeTypeName, IFunctionCallNode, INode, ISymbolNode, IVardecNode, NodeType } from "./parser";

export class TokenError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[TokenError] ") + message);
    }
}

export class SyntaxError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[SyntaxError] ") + message);
    }
}

export class TypeError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[TypeError] ") + message);
    }
    
    static xNotFound(x: string, v?: IVar[]) {
        return new TypeError(chalk.redBright(x) + (v ? chalk.grey(` (current symbols: ${v.map(b => b.name).join(', ')})`) : ""))
    }

    static symbolNotFound(s: ISymbolNode, v: IVar[]) {
        return this.xNotFound(`symbol ${s.name} not found`, v);
    }

    static functionNotFound(f: IFunctionCallNode) {
        return this.xNotFound(`function ${f.name} not found`);
    }

    static vardecTypeCheckError(n: IVardecNode) {
        return new TypeError(`Expected value of ${n.varname} (${n.varval}) to be a ${n.vartype}; got ${typeof n.varval} instead.`);
    }
}

export class EvaluationError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[EvaluationError] ") + message);
    }

    static invalidProgramStructure(n: INode) {
        return new EvaluationError(`Invalid program structure (a command has to be a variable declaration or a function call, but it is ${getNodeTypeName(n.type)}).`);
    }
}

export class UnimplementedError extends Error {
    public name = "";

    constructor(message: string) {
        super(chalk.red("[UnimplementedError] ") + message);
    }
}