import { Instruction, IOP1, IOP2, IOP3, IVAR, IEXPR } from './instruction';

export default function substitute(tokens: Array<any>, variable: any, expr: any): any {
	var newexpression = [];
	for (var i = 0; i < tokens.length; i++) {
		var item = tokens[i];
		var type = item.type;
		if (type === IVAR && item.value === variable) {
			for (var j = 0; j < expr.tokens.length; j++) {
				var expritem = expr.tokens[j];
				var replitem;
				if (expritem.type === IOP1) {
					replitem = Instruction.unaryInstruction(expritem.value);
				} else if (expritem.type === IOP2) {
					replitem = Instruction.binaryInstruction(expritem.value);
				} else if (expritem.type === IOP3) {
					replitem = Instruction.ternaryInstruction(expritem.value);
				} else {
					replitem = new Instruction(expritem.type, expritem.value);
				}
				newexpression.push(replitem);
			}
		} else if (type === IEXPR) {
			newexpression.push(new Instruction(IEXPR, substitute(item.value, variable, expr)));
		} else {
			newexpression.push(item);
		}
	}
	return newexpression;
}
