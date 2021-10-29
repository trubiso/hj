import { IValueNode, NodeType } from "../parser/nodes";
import IDataClass from "./dataClass";

export default class String implements IDataClass {
    constructor() {}

    public _add(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.StringLiteral,
            value: string1.value + string2.value
        } as IValueNode;
    }
    public _subtract(_string1: IValueNode, _string2: IValueNode): IValueNode {
        throw 'Unsupported operator for two strings: \'-\'';
    }
    public _multiply(_string1: IValueNode, _string2: IValueNode): IValueNode {
        throw 'Unsupported operator for two strings: \'*\'';
    }
    public _divide(_string1: IValueNode, _string2: IValueNode): IValueNode {
        throw 'Unsupported operator for two strings: \'/\'';
    }
    public _pow(_string1: IValueNode, _string2: IValueNode): IValueNode {
        throw 'Unsupported operator for two strings: \'**\'';
    }
    public _equals(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: string1.value === string2.value
        } as IValueNode;
    }
    public _equalsNot(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: string1.value !== string2.value
        } as IValueNode;
    }
    public _greater(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: string1.value.localeCompare(string2.value) === 1
        } as IValueNode;
    }
    public _greaterEqual(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this._smaller(string1, string2).value
        } as IValueNode;
    }
    public _smaller(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: string1.value.localeCompare(string2.value) === -1 // hm
        } as IValueNode;
    }
    public _smallerEqual(string1: IValueNode, string2: IValueNode): IValueNode {
        return {
            type: NodeType.Boolean,
            value: !this._greater(string1, string2).value
        } as IValueNode;
    }
}