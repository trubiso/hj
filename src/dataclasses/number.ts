import { IValueNode, NodeType } from "../parser/nodes";
import IDataClass from "./dataClass";

export default class Number implements IDataClass {
    constructor() {}

    public add(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.NumberLiteral,
            value: number1.value + number2.value
        } as IValueNode
    }
    public subtract(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.NumberLiteral,
            value: number1.value - number2.value
        } as IValueNode
    }
    public multiply(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.NumberLiteral,
            value: number1.value * number2.value
        } as IValueNode
    }
    public divide(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.NumberLiteral,
            value: number1.value / number2.value
        } as IValueNode
    }
    public pow(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.NumberLiteral,
            value: number1.value ** number2.value
        } as IValueNode
    }

    public equals(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: number1.value === number2.value
        } as IValueNode;
    }
    public equalsNot(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: number1.value !== number2.value
        } as IValueNode;
    }
    public greater(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: number1.value > number2.value
        } as IValueNode;
    }
    public greaterEqual(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this.smaller(number1, number2).value
        } as IValueNode;
    }
    public smaller(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: number1.value < number2.value
        } as IValueNode;
    }
    public smallerEqual(number1: IValueNode, number2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this.greater(number1, number2).value
        } as IValueNode;
    }
}