export default class Pos {
    public idx: number;
    public ln: number;
    public col: number;
    public code: string;

    constructor(idx: number, ln: number, col: number, code: string) {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
        this.code = code;
    }
    
    public advance(n: number) {
        for (let i = 0; i < (n || 1); i++) {
            this.idx++;
            this.col++;
            if (this.code[this.idx] === '\n') {
                this.col = 0;
                this.ln++;
            }
        }
    }
    
    public clone() {
        return new Pos(this.idx, this.ln, this.col, this.code);
    }

    public toString() {
        return `${this.ln}:${this.col} (idx: ${this.idx})`
    }
}