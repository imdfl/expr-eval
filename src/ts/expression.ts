import { IParser } from "./IParser";

import simplify from './simplify';
import substitute from './substitute';
import evaluate from './evaluate';
import expressionToString from './expression-to-string';
import getSymbols from './get-symbols';
import { IExpression } from "./IExpression";

export class Expression implements IExpression {
	public unaryOps: any
	public binaryOps: any
	public ternaryOps: any
	public functions: any

	constructor(public tokens: Array<any>, public parser: IParser) {
		this.tokens = tokens;
		this.parser = parser;
		this.unaryOps = parser.unaryOps;
		this.binaryOps = parser.binaryOps;
		this.ternaryOps = parser.ternaryOps;
		this.functions = parser.functions;
	}

	public simplify(values: any) {
		values = values || {};
		return new Expression(simplify(this.tokens, this.unaryOps, this.binaryOps, this.ternaryOps, values), this.parser);
	}

	public substitute(variable: any, expr: Expression) {
		if (!(expr instanceof Expression)) {
			expr = this.parser.parse(String(expr));
		}

		return new Expression(substitute(this.tokens, variable, expr), this.parser);
	}

	public evaluate(values: any) {
		values = values || {};
		return evaluate(this.tokens, this, values);
	}

	public toString = function () {
		return expressionToString(this.tokens, false);
	}

	public symbols(options: any) {
		options = options || {};
		const vars: Array<any> = [];
		getSymbols(this.tokens, vars, options);
		return vars;
	}

	public variables(options: any) {
		options = options || {};
		const vars: Array<any> = [];
		getSymbols(this.tokens, vars, options);
		const functions = this.functions;
		return vars.filter(function (name) {
			return !(name in functions);
		});
	}

	public toJSFunction(param: any, variables: any) {
		const expr = this;
		var f = new Function(param, 'with(this.functions) with (this.ternaryOps) with (this.binaryOps) with (this.unaryOps) { return ' + expressionToString(this.simplify(variables).tokens, true) + '; }'); // eslint-disable-line no-new-func
		return function () {
			return f.apply(expr, arguments);
		};
	}

}
