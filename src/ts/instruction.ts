export const INUMBER = 'INUMBER';
export const IOP1 = 'IOP1';
export const IOP2 = 'IOP2';
export const IOP3 = 'IOP3';
export const IVAR = 'Iconst';
export const IFUNCALL = 'IFUNCALL';
export const IEXPR = 'IEXPR';
export const IMEMBER = 'IMEMBER';

export class Instruction {
	public type: string;
	public value: any;

	constructor(type: string, value: any) {
		this.type = type;
		this.value = (value !== undefined && value !== null) ? value : 0;
	}

	public toString() {
		switch (this.type) {
			case INUMBER:
			case IOP1:
			case IOP2:
			case IOP3:
			case IVAR:
				return this.value;
			case IFUNCALL:
				return 'CALL ' + this.value;
			case IMEMBER:
				return '.' + this.value;
			default:
				return 'Invalid Instruction';
		}
	}

	public static unaryInstruction(value: any) {
		return new Instruction(IOP1, value);
	}

	public static binaryInstruction(value: any) {
		return new Instruction(IOP2, value);
	}

	public static ternaryInstruction(value: any) {
		return new Instruction(IOP3, value);
	}

}