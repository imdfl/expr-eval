import { TOP, TNUMBER, TSTRING, TPAREN, TCOMMA, TNAME } from './token';
import { Instruction, INUMBER, IVAR, IFUNCALL, IEXPR, IMEMBER } from './instruction';
import contains from './contains';
import { IParser } from './IParser';

const TERM_OPERATORS = ['*', '/', '%'];
const COMPARISON_OPERATORS = ['==', '!=', '<', '<=', '>=', '>', 'in'];
const ADD_SUB_OPERATORS = ['+', '-', '||'];

export class ParserState {
	public current: any = null;
	public nextToken: any = null;
	public savedCurrent: any = null;
	public savedNextToken: any = null;
	public allowMemberAccess: boolean;

	constructor(public parser: IParser, public tokens: any, options: any) {
		this.current = null;
		this.nextToken = null;
		this.next();
		this.savedCurrent = null;
		this.savedNextToken = null;
		this.allowMemberAccess = Boolean(options && options.allowMemberAccess !== false);
	}

	public next() {
		this.current = this.nextToken;
		return (this.nextToken = this.tokens.next());
	};

	public tokenMatches(token: any, value: any): boolean {
		if (typeof value === 'undefined') {
			return true;
		} else if (Array.isArray(value)) {
			return contains(value, token.value);
		} else if (typeof value === 'function') {
			return value(token);
		} else {
			return token.value === value;
		}
	};

	public save() {
		this.savedCurrent = this.current;
		this.savedNextToken = this.nextToken;
		this.tokens.save();
	}

	public restore() {
		this.tokens.restore();
		this.current = this.savedCurrent;
		this.nextToken = this.savedNextToken;
	}

	public accept(type: any, value?: any): boolean {
		if (this.nextToken.type === type && this.tokenMatches(this.nextToken, value)) {
			this.next();
			return true;
		}
		return false;
	}

	public expect(type: any, value?: any) {
		if (!this.accept(type, value)) {
			var coords = this.tokens.getCoordinates();
			throw new Error('parse error [' + coords.line + ':' + coords.column + ']: Expected ' + (value || type));
		}
	};

	public parseAtom(instr: any) {
		if (this.accept(TNAME)) {
			instr.push(new Instruction(IVAR, this.current.value));
		} else if (this.accept(TNUMBER)) {
			instr.push(new Instruction(INUMBER, this.current.value));
		} else if (this.accept(TSTRING)) {
			instr.push(new Instruction(INUMBER, this.current.value));
		} else if (this.accept(TPAREN, '(')) {
			this.parseExpression(instr);
			this.expect(TPAREN, ')');
		} else {
			throw new Error('unexpected ' + this.nextToken);
		}
	};

	public parseExpression(instr: any) {
		this.parseConditionalExpression(instr);
	};

	public parseConditionalExpression(instr: any) {
		this.parseOrExpression(instr);
		let trueBranch: Array<any>,
			falseBranch: Array<any>
		while (this.accept(TOP, '?')) {
			trueBranch = [];
			falseBranch = [];
			this.parseConditionalExpression(trueBranch);
			this.expect(TOP, ':');
			this.parseConditionalExpression(falseBranch);
			instr.push(new Instruction(IEXPR, trueBranch));
			instr.push(new Instruction(IEXPR, falseBranch));
			instr.push(Instruction.ternaryInstruction('?'));
		}
	};

	public parseOrExpression(instr: any) {
		this.parseAndExpression(instr);
		let falseBranch: Array<any>
		while (this.accept(TOP, 'or')) {
			falseBranch = [];
			this.parseAndExpression(falseBranch);
			instr.push(new Instruction(IEXPR, falseBranch));
			instr.push(Instruction.binaryInstruction('or'));
		}
	};

	public parseAndExpression(instr: any) {
		this.parseComparison(instr);
		let trueBranch: Array<any>
		while (this.accept(TOP, 'and')) {
			trueBranch = [];
			this.parseComparison(trueBranch);
			instr.push(new Instruction(IEXPR, trueBranch));
			instr.push(Instruction.binaryInstruction('and'));
		}
	};


	public parseComparison(instr: any) {
		this.parseAddSub(instr);
		let op: any;
		while (this.accept(TOP, COMPARISON_OPERATORS)) {
			op = this.current;
			this.parseAddSub(instr);
			instr.push(Instruction.binaryInstruction(op.value));
		}
	}


	public parseAddSub(instr: any) {
		this.parseTerm(instr);
		let op: any;
		while (this.accept(TOP, ADD_SUB_OPERATORS)) {
			op = this.current;
			this.parseTerm(instr);
			instr.push(Instruction.binaryInstruction(op.value));
		}
	}


	public parseTerm(instr: any) {
		this.parseFactor(instr);
		while (this.accept(TOP, TERM_OPERATORS)) {
			var op = this.current;
			this.parseFactor(instr);
			instr.push(Instruction.binaryInstruction(op.value));
		}
	}

	public parseFactor(instr: any) {
		var unaryOps = this.tokens.unaryOps;
		function isPrefixOperator(token: any) {
			return token.value in unaryOps;
		}

		this.save();
		if (this.accept(TOP, isPrefixOperator)) {
			if ((this.current.value !== '-' && this.current.value !== '+' && this.nextToken.type === TPAREN && this.nextToken.value === '(')) {
				this.restore();
				this.parseExponential(instr);
			} else {
				var op = this.current;
				this.parseFactor(instr);
				instr.push(Instruction.unaryInstruction(op.value));
			}
		} else {
			this.parseExponential(instr);
		}
	}

	public parseExponential(instr: any) {
		this.parsePostfixExpression(instr);
		while (this.accept(TOP, '^')) {
			this.parseFactor(instr);
			instr.push(Instruction.binaryInstruction('^'));
		}
	}

	public parsePostfixExpression(instr: any) {
		this.parseFunctionCall(instr);
		while (this.accept(TOP, '!')) {
			instr.push(Instruction.unaryInstruction('!'));
		}
	}

	public parseFunctionCall(instr: any) {
		var unaryOps = this.tokens.unaryOps;
		function isPrefixOperator(token: any) {
			return token.value in unaryOps;
		}

		if (this.accept(TOP, isPrefixOperator)) {
			var op = this.current;
			this.parseAtom(instr);
			instr.push(Instruction.unaryInstruction(op.value));
		} else {
			this.parseMemberExpression(instr);
			while (this.accept(TPAREN, '(')) {
				if (this.accept(TPAREN, ')')) {
					instr.push(new Instruction(IFUNCALL, 0));
				} else {
					var argCount = this.parseArgumentList(instr);
					instr.push(new Instruction(IFUNCALL, argCount));
				}
			}
		}
	};

	public parseArgumentList(instr: any) {
		var argCount = 0;

		while (!this.accept(TPAREN, ')')) {
			this.parseExpression(instr);
			++argCount;
			while (this.accept(TCOMMA)) {
				this.parseExpression(instr);
				++argCount;
			}
		}

		return argCount;
	};

	public parseMemberExpression(instr: any) {
		this.parseAtom(instr);
		while (this.accept(TOP, '.')) {
			if (!this.allowMemberAccess) {
				throw new Error('unexpected ".", member access is not permitted');
			}

			this.expect(TNAME);
			instr.push(new Instruction(IMEMBER, this.current.value));
		}
	}
}
