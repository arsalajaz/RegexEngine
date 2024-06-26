const last = stack => stack[stack.length - 1]

const parse = (expr) => {
    const stack = [[]];
    let i = 0;
    while (i < expr.length) {
        const next = expr[i]

        switch (next) {
            case '.': {
                last(stack).push({
                    type: 'wildcard',
                    quantifier: 'exactlyOne'
                });
                i++;
                continue;
            }

            case '?': {
                const lastElement = last(last(stack));

                if (!lastElement || lastElement.quantifier !== 'exactlyOne') {
                    throw new Error('Quantifer must follow an unquantified element or group')
                }

                lastElement.quantifier = 'zeroOrOne';
                i++;
                continue;
            }

            case '*': {
                const lastElement = last(last(stack));

                if (!lastElement || lastElement.quantifier !== 'exactlyOne') {
                    throw new Error('Quantifer must follow an unquantified element or group')
                }

                lastElement.quantifier = 'zeroOrMore';
                i++;
                continue;
            }

            case '+': {
                const lastElement = last(last(stack));

                if (!lastElement || lastElement.quantifier !== 'exactlyOne') {
                    throw new Error('Quantifer must follow an unquantified element or group')
                }

                const zeroOrMoreCopy = { ...lastElement, quantifier: 'zeroOrMore' };
                last(stack).push(zeroOrMoreCopy);

                i++;
                continue;
            }

            case '(': {
                stack.push([]);
                i++;
                continue;
            }

            case ')': {
                if (stack.length <= 1) {
                    throw new Error(`No group to close at index ${i}`)
                }

                const states = stack.pop();
                last(stack).push({
                    type: 'groupElement',
                    states,
                    quantifier: 'exactlyOne'
                });
                i++;
                continue;
            }

            case '\\': {
                if (i + 1 >= expr.length) {
                    throw new Error(`Bad escape character at index ${i}`)
                }

                last(stack).push({
                    type: 'element',
                    value: expr[i + 1],
                    quantifier: 'exactlyOne'
                })

                i += 2;
                continue;
            }

            default: {
                last(stack).push({
                    type: 'element',
                    value: next,
                    quantifier: 'exactlyOne'
                })

                i++;
                continue;
            }
        }

    }

    if (stack.length !== 1) {
        throw new Error('Unmatched groups in regular expression');
    }

    return stack[0];
}



export default parse;