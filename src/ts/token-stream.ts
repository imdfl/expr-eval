import { Token, TEOF, TOP, TNUMBER, TSTRING, TPAREN, TCOMMA, TNAME } from './token';
import { IParser } from "./IParser";

const codePointPattern: RegExp = /^[0-9a-f]{4}$/i;

const optionNameMap = {
	'+': 'add',
	'-': 'subtract',
	'*': 'multiply',
	'/': 'divide',
	'%': 'remainder',
	'^': 'power',
	'!': 'factorial',
	'<': 'comparison',
	'>': 'comparison',
	'<=': 'comparison',
	'>=': 'comparison',
	'==': 'comparison',
	'!=': 'comparison',
	'||': 'concatenate',
	'and': 'logical',
	'or': 'logical',
	'not': 'logical',
	'?': 'conditional',
	':': 'conditional'
};

const getOptionName = function(op: string) {
	return optionNameMap.hasOwnProperty(op) ? optionNameMap[op] : op;
}

export class TokenStream {
	public pos = 0;
	public current: any = null;
	public unaryOps: any;
	public binaryOps: any;
	public ternaryOps: any;
	public consts: any;
	public expression: any;
	public savedPosition = 0;
	public savedCurrent: any = null;
	public options: any;

	constructor(parser: IParser, expression: any) {
		this.unaryOps = parser.unaryOps;
		this.binaryOps = parser.binaryOps;
		this.ternaryOps = parser.ternaryOps;
		this.consts = parser.consts;
		this.expression = expression;
		this.savedPosition = 0;
		this.savedCurrent = null;
		this.options = parser.options;
	}

	public newToken(type: string, value: any, pos?: any): Token {
		return new Token(type, value, pos != null ? pos : this.pos);
	}

	public save() {
		this.savedPosition = this.pos;
		this.savedCurrent = this.current;
	}

	public restore() {
		this.pos = this.savedPosition;
		this.current = this.savedCurrent;
	}

	public next(): Token {
		if (this.pos >= this.expression.length) {
			return this.newToken(TEOF, 'EOF');
		}

		if (this.isWhitespace() || this.isComment()) {
			return this.next();
		}
		else if (this.isRadixInteger() ||
			this.isNumber() ||
			this.isOperator() ||
			this.isString() ||
			this.isParen() ||
			this.isComma() ||
			this.isNamedOp() ||
			this.isConst() ||
			this.isName()) {
			return this.current;
		} else {
			this.parseError('Unknown character "' + this.expression.charAt(this.pos) + '"');
		}
	}

	public isString(): boolean {
		var r = false;
		var startPos = this.pos;
		var quote = this.expression.charAt(startPos);

		if (quote === '\'' || quote === '"') {
			var index = this.expression.indexOf(quote, startPos + 1);
			while (index >= 0 && this.pos < this.expression.length) {
				this.pos = index + 1;
				if (this.expression.charAt(index - 1) !== '\\') {
					var rawString = this.expression.substring(startPos + 1, index);
					this.current = this.newToken(TSTRING, this.unescape(rawString), startPos);
					r = true;
					break;
				}
				index = this.expression.indexOf(quote, index + 1);
			}
		}
		return r;
	};

	public isParen(): boolean {
		const c = this.expression.charAt(this.pos);
		if (c === '(' || c === ')') {
			this.current = this.newToken(TPAREN, c);
			this.pos++;
			return true;
		}
		return false;
	};

	public isComma(): boolean {
		const c = this.expression.charAt(this.pos);
		if (c === ',') {
			this.current = this.newToken(TCOMMA, ',');
			this.pos++;
			return true;
		}
		return false;
	};

	public isConst(): boolean {
		let startPos = this.pos;
		let i = startPos;
		let c: string;
		for (; i < this.expression.length; i++) {
			c = this.expression.charAt(i);
			if (c.toUpperCase() === c.toLowerCase()) {
				if (i === this.pos || (c !== '_' && c !== '.' && (c < '0' || c > '9'))) {
					break;
				}
			}
		}
		if (i > startPos) {
			var str = this.expression.substring(startPos, i);
			if (str in this.consts) {
				this.current = this.newToken(TNUMBER, this.consts[str]);
				this.pos += str.length;
				return true;
			}
		}
		return false;
	}

	public isNamedOp(): boolean {
		let startPos = this.pos,
			i = startPos,
			c: string;
		for (; i < this.expression.length; i++) {
			c = this.expression.charAt(i);
			if (c.toUpperCase() === c.toLowerCase()) {
				if (i === this.pos || (c !== '_' && (c < '0' || c > '9'))) {
					break;
				}
			}
		}
		if (i > startPos) {
			var str = this.expression.substring(startPos, i);
			if (this.isOperatorEnabled(str) && (str in this.binaryOps || str in this.unaryOps || str in this.ternaryOps)) {
				this.current = this.newToken(TOP, str);
				this.pos += str.length;
				return true;
			}
		}
		return false;
	}

	public isName(): boolean {
		let startPos = this.pos,
			i = startPos,
			hasLetter = false,
			c: string;
		for (; i < this.expression.length; i++) {
			c = this.expression.charAt(i);
			if (c.toUpperCase() === c.toLowerCase()) {
				if (i === this.pos && (c === '$' || c === '_')) {
					if (c === '_') {
						hasLetter = true;
					}
					continue;
				} else if (i === this.pos || !hasLetter || (c !== '_' && (c < '0' || c > '9'))) {
					break;
				}
			} else {
				hasLetter = true;
			}
		}
		if (hasLetter) {
			var str = this.expression.substring(startPos, i);
			this.current = this.newToken(TNAME, str);
			this.pos += str.length;
			return true;
		}
		return false;
	};

	public isWhitespace(): boolean {
		let r = false,
			c: string = this.expression.charAt(this.pos);
		while (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
			r = true;
			this.pos++;
			if (this.pos >= this.expression.length) {
				break;
			}
			c = this.expression.charAt(this.pos);
		}
		return r;
	}


	public unescape(v: any): any {
		let index = v.indexOf('\\');
		if (index < 0) {
			return v;
		}

		let buffer = v.substring(0, index),
			c: string;
		while (index >= 0) {
			c = v.charAt(++index);
			switch (c) {
				case '\'':
					buffer += '\'';
					break;
				case '"':
					buffer += '"';
					break;
				case '\\':
					buffer += '\\';
					break;
				case '/':
					buffer += '/';
					break;
				case 'b':
					buffer += '\b';
					break;
				case 'f':
					buffer += '\f';
					break;
				case 'n':
					buffer += '\n';
					break;
				case 'r':
					buffer += '\r';
					break;
				case 't':
					buffer += '\t';
					break;
				case 'u':
					// interpret the following 4 characters as the hex of the unicode code point
					var codePoint = v.substring(index + 1, index + 5);
					if (!codePointPattern.test(codePoint)) {
						this.parseError('Illegal escape sequence: \\u' + codePoint);
					}
					buffer += String.fromCharCode(parseInt(codePoint, 16));
					index += 4;
					break;
				default:
					throw this.parseError('Illegal escape sequence: "\\' + c + '"');
			}
			++index;
			var backslash = v.indexOf('\\', index);
			buffer += v.substring(index, backslash < 0 ? v.length : backslash);
			index = backslash;
		}

		return buffer;
	};

	public isComment = function () {
		var c = this.expression.charAt(this.pos);
		if (c === '/' && this.expression.charAt(this.pos + 1) === '*') {
			this.pos = this.expression.indexOf('*/', this.pos) + 2;
			if (this.pos === 1) {
				this.pos = this.expression.length;
			}
			return true;
		}
		return false;
	};

	public isRadixInteger = function () {
		var pos = this.pos;

		if (pos >= this.expression.length - 2 || this.expression.charAt(pos) !== '0') {
			return false;
		}
		++pos;

		var radix;
		var validDigit;
		if (this.expression.charAt(pos) === 'x') {
			radix = 16;
			validDigit = /^[0-9a-f]$/i;
			++pos;
		} else if (this.expression.charAt(pos) === 'b') {
			radix = 2;
			validDigit = /^[01]$/i;
			++pos;
		} else {
			return false;
		}

		var valid = false;
		var startPos = pos;

		while (pos < this.expression.length) {
			var c = this.expression.charAt(pos);
			if (validDigit.test(c)) {
				pos++;
				valid = true;
			} else {
				break;
			}
		}

		if (valid) {
			this.current = this.newToken(TNUMBER, parseInt(this.expression.substring(startPos, pos), radix));
			this.pos = pos;
		}
		return valid;
	};

	public isNumber = function () {
		var valid = false;
		var pos = this.pos;
		var startPos = pos;
		var resetPos = pos;
		var foundDot = false;
		var foundDigits = false;
		var c;

		while (pos < this.expression.length) {
			c = this.expression.charAt(pos);
			if ((c >= '0' && c <= '9') || (!foundDot && c === '.')) {
				if (c === '.') {
					foundDot = true;
				} else {
					foundDigits = true;
				}
				pos++;
				valid = foundDigits;
			} else {
				break;
			}
		}

		if (valid) {
			resetPos = pos;
		}

		if (c === 'e' || c === 'E') {
			pos++;
			var acceptSign = true;
			var validExponent = false;
			while (pos < this.expression.length) {
				c = this.expression.charAt(pos);
				if (acceptSign && (c === '+' || c === '-')) {
					acceptSign = false;
				} else if (c >= '0' && c <= '9') {
					validExponent = true;
					acceptSign = false;
				} else {
					break;
				}
				pos++;
			}

			if (!validExponent) {
				pos = resetPos;
			}
		}

		if (valid) {
			this.current = this.newToken(TNUMBER, parseFloat(this.expression.substring(startPos, pos)));
			this.pos = pos;
		} else {
			this.pos = resetPos;
		}
		return valid;
	};

	public isOperator = function () {
		var startPos = this.pos;
		var c = this.expression.charAt(this.pos);

		if (c === '+' || c === '-' || c === '*' || c === '/' || c === '%' || c === '^' || c === '?' || c === ':' || c === '.') {
			this.current = this.newToken(TOP, c);
		} else if (c === '∙' || c === '•') {
			this.current = this.newToken(TOP, '*');
		} else if (c === '>') {
			if (this.expression.charAt(this.pos + 1) === '=') {
				this.current = this.newToken(TOP, '>=');
				this.pos++;
			} else {
				this.current = this.newToken(TOP, '>');
			}
		} else if (c === '<') {
			if (this.expression.charAt(this.pos + 1) === '=') {
				this.current = this.newToken(TOP, '<=');
				this.pos++;
			} else {
				this.current = this.newToken(TOP, '<');
			}
		} else if (c === '|') {
			if (this.expression.charAt(this.pos + 1) === '|') {
				this.current = this.newToken(TOP, '||');
				this.pos++;
			} else {
				return false;
			}
		} else if (c === '=') {
			if (this.expression.charAt(this.pos + 1) === '=') {
				this.current = this.newToken(TOP, '==');
				this.pos++;
			} else {
				return false;
			}
		} else if (c === '!') {
			if (this.expression.charAt(this.pos + 1) === '=') {
				this.current = this.newToken(TOP, '!=');
				this.pos++;
			} else {
				this.current = this.newToken(TOP, c);
			}
		} else {
			return false;
		}
		this.pos++;

		if (this.isOperatorEnabled(this.current.value)) {
			return true;
		} else {
			this.pos = startPos;
			return false;
		}
	};



	public isOperatorEnabled(op: any): boolean {
		var optionName = getOptionName(op);
		var operators = this.options.operators || {};

		// in is a special case for now because it's disabled by default
		if (optionName === 'in') {
			return !!operators['in'];
		}

		return !(optionName in operators) || !!operators[optionName];
	};

	public getCoordinates(): any {
		var line = 0;
		var column;
		var newline = -1;
		do {
			line++;
			column = this.pos - newline;
			newline = this.expression.indexOf('\n', newline + 1);
		} while (newline >= 0 && newline < this.pos);

		return {
			line: line,
			column: column
		};
	}

	public parseError(msg: string): Error {
		const coords = this.getCoordinates();
		throw new Error('parse error [' + coords.line + ':' + coords.column + ']: ' + msg);
	}
}
