import { IValueNode, NodeType } from "../parser";
import IDataClass from "./dataClass";

export default class String implements IDataClass {
    constructor() {}

    public add(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.StringLiteral,
            value: string1.value + string2.value
        } as IValueNode;
    }
    public subtract(_string1: IValueNode, _string2: IValueNode): IValueNode {
        throw 'Unsupported operator for two strings: \'-\'';
    }
    public multiply(_string1: IValueNode, _string2: IValueNode): IValueNode {
        throw 'Unsupported operator for two strings: \'*\'';
    }
    public divide(_string1: IValueNode, _string2: IValueNode): IValueNode {
        throw 'Unsupported operator for two strings: \'/\'';
    }
    public pow(_string1: IValueNode, _string2: IValueNode): IValueNode {
        throw 'Unsupported operator for two strings: \'**\'';
    }
    public equals(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: string1.value === string2.value
        } as IValueNode;
    }
    public equalsNot(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: string1.value !== string2.value
        } as IValueNode;
    }
    public greater(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: string1.value.localeCompare(string2.value) === 1
        } as IValueNode;
    }
    public greaterEqual(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this.smaller(string1, string2).value
        } as IValueNode;
    }
    public smaller(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: string1.value.localeCompare(string2.value) === -1 // hm
        } as IValueNode;
    }
    public smallerEqual(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this.greater(string1, string2).value
        } as IValueNode;
    }
}