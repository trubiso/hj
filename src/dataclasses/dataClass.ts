import { IValueNode } from "../parser";

export default interface IDataClass {
    add(value1: IValueNode, value2: IValueNode): IValueNode;
    subtract(value1: IValueNode, value2: IValueNode): IValueNode;
    multiply(value1: IValueNode, value2: IValueNode): IValueNode;
    divide(value1: IValueNode, value2: IValueNode): IValueNode;
    pow(value1: IValueNode, value2: IValueNode): IValueNode;

    equals(value1: IValueNode, value2: IValueNode): IValueNode;
    equalsNot(value1: IValueNode, value2: IValueNode): IValueNode;
    greater(value1: IValueNode, value2: IValueNode): IValueNode;
    greaterEqual(value1: IValueNode, value2: IValueNode): IValueNode;
    smaller(value1: IValueNode, value2: IValueNode): IValueNode;
    smallerEqual(value1: IValueNode, value2: IValueNode): IValueNode;
}