import { UnimplementedError } from "../errors";
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

    private parseIdx(idx: number) { return idx < 0 ? this.length + idx : idx; }

    public set = (idx: number, value: IValueNode): void => {
        if (!(value.type === this.type)) throw `Cannot insert element ${value.value} (of type ${getNodeTypeName(value.type)}) into array with nodes of type ${getNodeTypeName(this.type!)}; they are not of the same type.`;
        if (idx < this.length) {
            const pidx = this.parseIdx(idx);
            if (pidx > this.length / 2) {
                let i = this.length - 1;
                let current = this.end;
                while (current !== null) {
                    if (i === pidx) {
                        current.value = value.value;
                    }
                    current = current.previous;
                    i--;
                }
            } else {
                let i = 0;
                let current = this.start;
                while (current !== null) {
                    if (i === pidx) {
                        current.value = value.value;
                    }
                    current = current.next;
                    i++;
                }
            }
        } else {
            throw new UnimplementedError('setting vals outside the arr\'s length');
        }
    }

    public access = (start: IValueNode, end?: IValueNode, step?: IValueNode, hasFirstSep?: boolean) : IValueNode => {
        const startIdx = start ? this.parseIdx(start.value) : 0;
        const endIdx = end ? this.parseIdx(this.parseIdx(end.value) - 1) : (step || hasFirstSep ? this.length - 1 : startIdx);
        const stepVal = step ? this.parseIdx(step.value) : 1;

        let result = [];
        let stepActualVal = 1;

        let i = 0;
        let current = this.start;

        while (current !== null) {
            if (i >= startIdx && i <= endIdx) {
                stepActualVal = stepVal;
                result.push(current.value);
            }
            for (let j = 0 ; j < stepActualVal ; j ++) {
                if (current === null) break;
                current = current.next; i++;
            }
        }

        if (!result[1]) return { type: this.type!, value: result[0] };
        else return { type: NodeType.Array, value: new Array(...result.map(v => {
            return {
                type: this.type,
                value: v
            } as IValueNode;
        })) };
    }

    public pick = () => {
        const idx = Math.floor(Math.random() * this.length);
        return this.access({
            type: NodeType.NumberLiteral,
            value: idx
        }).value;
    }

    public forEach = (callback: (v: any, i: number) => any) => {
        let i = 0;
        let current = this.start;
        while (current !== null) {
            callback(current.value, i);
            current = current.next;
            i++;
        }
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