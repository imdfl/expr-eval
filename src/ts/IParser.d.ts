import evaluate from "./evaluate";

export interface IParserOptions {
	allowMemberAccess?: boolean;
	operators?: {
		add?: boolean,
		comparison?: boolean,
		concatenate?: boolean,
		conditional?: boolean,
		divide?: boolean,
		factorial?: boolean,
		logical?: boolean,
		multiply?: boolean,
		power?: boolean,
		remainder?: boolean,
		subtract?: boolean,
		sin?: boolean,
		cos?: boolean,
		tan?: boolean,
		asin?: boolean,
		acos?: boolean,
		atan?: boolean,
		sinh?: boolean,
		cosh?: boolean,
		tanh?: boolean,
		asinh?: boolean,
		acosh?: boolean,
		atanh?: boolean,
		sqrt?: boolean,
		log?: boolean,
		ln?: boolean,
		lg?: boolean,
		log10?: boolean,
		abs?: boolean,
		ceil?: boolean,
		floor?: boolean,
		round?: boolean,
		trunc?: boolean,
		exp?: boolean,
		length?: boolean,
		in?: boolean
	};
}

interface IParser {
	options: { [name: string]: any };
	functions: { [name: string]: Function };
	consts: { [name: string]: any };
	binaryOps: { [name: string]: any };
	ternaryOps: { [name: string]: any };
	unaryOps: { [name: string]: any };
	parse(expr: string): any;
	evaluate(expr: string, variables: any): any;
}

