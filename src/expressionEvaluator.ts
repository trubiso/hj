import IDataClass from "./dataclasses/dataClass";
import Fraction from "./dataclasses/fraction";
import Number from "./dataclasses/number";
import String from "./dataclasses/string";
import { SyntaxError } from "./errors";
import { getNodeTypeName, IExpressionNode, IOperatorNode, IValueNode, NodeType } from "./parser/nodes";
import { Operator } from "./token";

export default class ExpressionEvaluator {

    private static operatorPriorities: Operator[][] = [['**'], ['*', '/'], ['+', '-'], ['==', '<', '<=', '>', '>=', '!=']];
    private static possibleValueTypes: NodeType[] = [NodeType.Boolean, NodeType.NumberLiteral, NodeType.StringLiteral, NodeType.Fraction];

    private static convertBoolNodeToNumberNode(boolNode: IValueNode): IValueNode {
        boolNode.type = NodeType.NumberLiteral;
        if (boolNode.value) {
            boolNode.value = 1;
        } else {
            boolNode.value = 0;
        }
        return boolNode;
    }

    private static evaluateSimpleOperation(value1: IValueNode, value2: IValueNode, operator: IOperatorNode): IValueNode {

        // convert booleans to int to perform operations with them
        if (value1.type === NodeType.Boolean) {
            value1 = this.convertBoolNodeToNumberNode(value1);
        }
        if (value2.type === NodeType.Boolean) {
            value2 = this.convertBoolNodeToNumberNode(value2);
        }

        let dataclass: IDataClass;

        // assign the corresponding dataclass
        switch (value1.type) {
        case NodeType.NumberLiteral:
            dataclass = new Number;
            break;
        case NodeType.StringLiteral:
            dataclass = new String;
            break;
        case NodeType.Fraction:
            dataclass = new Fraction(1, 1); // this isn't very elegant but idk how to make typescript shut up
            break;
        default:
            throw `What the hell are you trying to operate with? (given: ${getNodeTypeName(value1.type)})`
        }

        // conditional operators
        if (this.operatorPriorities[3].includes(operator.operator)) {
            // cross type comparison for equals and notEquals
            if (value1.type !== value2.type) {
                if (['==', '!='].includes(operator.operator)) { // objects of a different type will never be the same
                    return {
                        type: NodeType.Boolean,
                        value: false
                    } as IValueNode
                }
                throw `Unsupported conditional operator for two different types: ${operator.operator}`
            }

            switch (operator.operator) {
            case '==': return dataclass._equals(value1, value2)
            case '!=': return dataclass._equalsNot(value1, value2)
            case '>': return dataclass._greater(value1, value2)
            case '>=': return dataclass._greaterEqual(value1, value2)
            case '<': return dataclass._smaller(value1, value2)
            case '<=': return dataclass._smallerEqual(value1, value2)
            default: throw `Wth how is this possible`;
            }
        }
        
        // check if it's an operator supported in expressions
        if (!['**', '*', '/', '+', '-'].includes(operator.operator)) throw `Cannot use assignment operators for expressions.`

        // check for similar type
        if (value1.type !== value2.type) throw `Cannot operate on 2 values of unmergable types.`;

        // and perform the operation with the dataclass (may throw errors that the operator is unsupported for that dataclass)
        switch (operator.operator) {
        case '+': return dataclass._add(value1, value2)
        case '-': return dataclass._subtract(value1, value2)
        case '*': return dataclass._multiply(value1, value2)
        case '/': return dataclass._divide(value1, value2)
        case '**': return dataclass._pow(value1, value2)
        default: throw `Invalid operator: \'${operator.operator}\'.`
        }
    }

    // this function takes a list of the operators to search for and the expression node where it will search, and finds the first operator in that expression node that is included in the given operator list
    private static searchForNextOperator(operatorList: Operator[], expr: IExpressionNode) : number | null {
        let nodeIndex: number = 0;
        // go through all sub-nodes
        for (const subNode of expr.expr) {
            // check for matching operator
            if (subNode.type === NodeType.Operator && operatorList.includes((subNode as IOperatorNode).operator)) {
                return nodeIndex
            }
            nodeIndex++;
        }
        return null;
    }

    public static evaluateExpressionNode(expr: IExpressionNode) : IValueNode {
        // the code goes through all 3 priority levels once and replaces an equation with them to the result (e.g. 5 ** 3 in 2 + 5 ** 3 * 2 to 2 + 125 * 2 in step 1)
        
        // current priority level (0, 1 or 2)
        let currentPriorityLevel: number = 0;

        let nextOperatorIndex: number | null;
        
        // the while loop will break once no operations are left to do
        while (true) {
            nextOperatorIndex = this.searchForNextOperator(this.operatorPriorities[currentPriorityLevel], expr);
            if (nextOperatorIndex !== null) {
                // check if the operator is outside of the possible range (at the very start or very end)
                if (!(0 < nextOperatorIndex && nextOperatorIndex < expr.expr.length-1)) {
                    throw 'The operator is at an invalid position in an expression'; // TODO: better error
                }
                // determine the values matching to the operator (the nodes before and after it)
                let valueBefore = expr.expr[nextOperatorIndex-1];
                let valueAfter = expr.expr[nextOperatorIndex+1];
                // check if one of the values is a sub-expression => if yes, recursion
                if (valueBefore.type === NodeType.Expression) {
                    valueBefore = this.evaluateExpressionNode(valueBefore as IExpressionNode);
                }
                if (valueAfter.type === NodeType.Expression) {
                    valueAfter = this.evaluateExpressionNode(valueAfter as IExpressionNode);
                }
                // check if both values are actual values
                for (let value of [valueBefore, valueAfter]) {
                    if (this.possibleValueTypes.includes(value.type)) {
                        continue;
                    } else {
                        throw SyntaxError.invalidNode('operator', 'a valid value', value.type)
                    }
                }
                // get the result
                let result: IValueNode = this.evaluateSimpleOperation((valueBefore as IValueNode), (valueAfter as IValueNode), (expr.expr[nextOperatorIndex] as IOperatorNode));
                // replace valueBefore, valueAfter and operator with the result in the node list
                expr.expr[nextOperatorIndex-1] = result;
                expr.expr.splice(nextOperatorIndex, 2); 
            } else {
                // going down in the priority
                if (currentPriorityLevel < this.operatorPriorities.length - 1) {
                    currentPriorityLevel++;
                }
                // there is no unevaluated operator left, there should be exactly one Node which is the final result
                else {
                    if (expr.expr.length !== 1) {
                        console.log(expr.expr);
                        throw 'There wasn\'t a single result while evaluating expression.'; // TODO: better error
                    }
                    // there could be the case that there is no operator, but a sub-expression-node left => recursion to handle it
                    if (expr.expr[0].type === NodeType.Expression) {
                        this.evaluateExpressionNode(expr.expr[0] as IExpressionNode)
                    }
                    // FINISHED
                    break;
                }
            }
        }
        return expr.expr[0] as IValueNode;
    }
}