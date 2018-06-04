export const TEOF = 'TEOF';
export const TOP = 'TOP';
export const TNUMBER = 'TNUMBER';
export const TSTRING = 'TSTRING';
export const TPAREN = 'TPAREN';
export const TCOMMA = 'TCOMMA';
export const TNAME = 'TNAME';

export class Token {
	constructor(public type: string, public value: any, public index: number) { }

	public toString = function () {
		return this.type + ': ' + this.value;
	}
}
