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
}