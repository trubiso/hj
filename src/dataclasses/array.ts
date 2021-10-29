import { getNodeTypeName, IValueNode, NodeType } from "../parser/nodes";

export default class Array {
    public type: NodeType | null;
    public start: ArrayElement | null;
    public end: ArrayElement | null;
    public length: number;

    constructor(...elements: IValueNode[]) {
        if (elements.length) {
            let l: number = 1;
            this.start = new ArrayElement(elements[0].value, null, null);
            this.type = NodeType.NumberLiteral;
            let current: ArrayElement = this.start;
            let next: ArrayElement;
            for (const el of elements.slice(1)) {
                if (this.type !== el.type) throw `Cannot insert element ${el.value} (of type ${getNodeTypeName(el.type)}) into array with nodes of type ${getNodeTypeName(this.type)}; they are not of the same type.`;
                next = new ArrayElement(el.value, current, null);
                current.next = next;
                current = next;
                l++;
            }
            this.end = current;
            this.length = l;
        } else {
            this.start = null;
            this.end = null;
            this.type = null;
            this.length = 0;
        }
    }

    public has = (element: IValueNode): boolean => {
        if (element.type === this.type && this.length) {
            let current = this.start;
            while (current !== null) {
                if (current!.value === element.value) {
                    return true;
                }
                current = current.next;
            }
        }
        return false; 
    }

    public append = (...elements: IValueNode[]): Array => {
        for (const element of elements) {
            if (!this.type || element.type === this.type) {
                if (!this.type) this.type = element.type;
                if (this.length) {
                    let newEl: ArrayElement = new ArrayElement(element.value, this.end!, null);
                    this.end!.next = newEl;
                    this.end = newEl;
                } else {
                    let newEl: ArrayElement = new ArrayElement(element.value, null, null);
                    this.start = newEl;
                    this.end = newEl;
                }
                this.length++;
            } else throw `Cannot insert element ${element.value} (of type ${getNodeTypeName(element.type)}) into array with nodes of type ${getNodeTypeName(this.type!)}; they are not of the same type.`;
        }
        return this;
    }


    public prepend = (...elements: IValueNode[]): Array => {
        for (const element of elements) {
            if (!this.type || element.type === this.type) {
                if (!this.type) this.type = element.type;
                if (this.length) {
                    let newEl: ArrayElement = new ArrayElement(element.value, null, this.start!);
                    this.start!.previous = newEl;
                    this.start = newEl;
                } else {
                    let newEl: ArrayElement = new ArrayElement(element.value, null, null);
                    this.start = newEl;
                    this.end = newEl;
                }
                this.length++;
            } else throw `Cannot insert element ${element.value} (of type ${getNodeTypeName(element.type)}) into array with nodes of type ${getNodeTypeName(this.type!)}; they are not of the same type.`;
        }
        return this;
    }

    public toString = (): string => {
        let str: string = "[";
        if (this.length) {
            let current = this.start;
            while (current !== null) {
                str += current.value.toString();
                if (current.next) {
                    str += ", ";
                }
                current = current.next;
            }
        }
        return str + "]";
    }
}


export class ArrayElement {
    public value: any;
    public previous: ArrayElement | null;
    public next: ArrayElement | null;

    constructor(value: any, previous: ArrayElement | null, next: ArrayElement | null) {
        this.value = value;
        this.previous = previous;
        this.next = next;
    }
}