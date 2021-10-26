import { IValueNode, NodeType } from "../parser";
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
}