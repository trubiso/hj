import { IValueNode } from "../parser/nodes";

export default interface IDataClass {
    _add(value1: IValueNode, value2: IValueNode): IValueNode;
    _subtract(value1: IValueNode, value2: IValueNode): IValueNode;
    _multiply(value1: IValueNode, value2: IValueNode): IValueNode;
    _divide(value1: IValueNode, value2: IValueNode): IValueNode;
    _pow(value1: IValueNode, value2: IValueNode): IValueNode;

    _equals(value1: IValueNode, value2: IValueNode): IValueNode;
    _equalsNot(value1: IValueNode, value2: IValueNode): IValueNode;
    _greater(value1: IValueNode, value2: IValueNode): IValueNode;
    _greaterEqual(value1: IValueNode, value2: IValueNode): IValueNode;
    _smaller(value1: IValueNode, value2: IValueNode): IValueNode;
    _smallerEqual(value1: IValueNode, value2: IValueNode): IValueNode;
}