import { TEOF } from './token';
import { IParser, IParserOptions } from "./IParser";
import { TokenStream } from './token-stream';
import { ParserState } from './parser-state';
import { Expression } from './expression';
import {
	add,
	sub,
	mul,
	div,
	mod,
	concat,
	equal,
	notEqual,
	greaterThan,
	lessThan,
	greaterThanEqual,
	lessThanEqual,
	andOperator,
	orOperator,
	inOperator,
	sinh,
	cosh,
	tanh,
	asinh,
	acosh,
	atanh,
	log10,
	neg,
	not,
	trunc,
	random,
	factorial,
	gamma,
	stringLength,
	hypot,
	condition,
	roundTo
} from './functions';

export class Parser implements IParser {
	public functions: { [name: string]: Function };
	public consts: { [name: string]: any };
	public binaryOps: { [name: string]: any };
	public ternaryOps: { [name: string]: any };
	public unaryOps: { [name: string]: any };

	private static _sharedParser: Parser;

	public static parse(expr: any) {
		if (!this._sharedParser) {
			this._sharedParser = new Parser();
		}
		return this._sharedParser.parse(expr);
	}

	public static evaluate(expr: any, variables: any) {
		if (!this._sharedParser) {
			this._sharedParser = new Parser();
		}
		return this._sharedParser.parse(expr).evaluate(variables);
	}

	public options: IParserOptions;

	constructor(public _options?: IParserOptions) {
		this.options = _options || {};

		this.unaryOps = {
			sin: Math.sin,
			cos: Math.cos,
			tan: Math.tan,
			asin: Math.asin,
			acos: Math.acos,
			atan: Math.atan,
			sinh: Math.sinh || sinh,
			cosh: Math.cosh || cosh,
			tanh: Math.tanh || tanh,
			asinh: Math.asinh || asinh,
			acosh: Math.acosh || acosh,
			atanh: Math.atanh || atanh,
			sqrt: Math.sqrt,
			log: Math.log,
			ln: Math.log,
			lg: Math.log10 || log10,
			log10: Math.log10 || log10,
			abs: Math.abs,
			ceil: Math.ceil,
			floor: Math.floor,
			round: Math.round,
			trunc: Math.trunc || trunc,
			'-': neg,
			'+': Number,
			exp: Math.exp,
			not: not,
			length: stringLength,
			'!': factorial
		};

		this.binaryOps = {
			'+': add,
			'-': sub,
			'*': mul,
			'/': div,
			'%': mod,
			'^': Math.pow,
			'||': concat,
			'==': equal,
			'!=': notEqual,
			'>': greaterThan,
			'<': lessThan,
			'>=': greaterThanEqual,
			'<=': lessThanEqual,
			and: andOperator,
			or: orOperator,
			'in': inOperator
		};

		this.ternaryOps = {
			'?': condition
		};

		this.functions = {
			random: random,
			fac: factorial,
			min: Math.min,
			max: Math.max,
			hypot: Math.hypot || hypot,
			pyt: Math.hypot || hypot, // backward compat
			pow: Math.pow,
			atan2: Math.atan2,
			'if': condition,
			gamma: gamma,
			roundTo: roundTo
		};

		this.consts = {
			E: Math.E,
			PI: Math.PI,
			'true': true,
			'false': false
		};
	}

	public parse = function (expr: string) {
		const instr: Array<any> = [];
		const parserState = new ParserState(
			this,
			new TokenStream(this, expr),
			{ allowMemberAccess: this.options.allowMemberAccess }
		);

		parserState.parseExpression(instr);
		parserState.expect(TEOF, 'EOF');

		return new Expression(instr, this);
	}

	public evaluate(expr: string, variables: any) {
		return this.parse(expr).evaluate(variables);
	}


}