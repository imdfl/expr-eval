export type Value = number
    | string
    | ((...args: Value[]) => Value)
	| { [propertyName: string]: Value };

export interface IExpression {
    simplify(values?: Value): IExpression;
    evaluate(values?: Value): number;
    substitute(variable: string, value: IExpression | string | number): IExpression;
    symbols(options?: { withMembers?: boolean }): string[];
    variables(options?: { withMembers?: boolean }): string[];
    toJSFunction(params: string, values?: Value): (...args: any[]) => number;
}
