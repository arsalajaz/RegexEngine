const stateMatchesStringAtIndex = (state, str, i) => {
    if (i >= str.length) {
        return [false, 0]
    }

    if (state.type === 'wildcard') {
        return [true, 1]
    }

    if (state.type === 'element') {
        const match = state.value === str[i];
        return [match, match ? 1 : 0]
    }

    if (state.type === 'groupElement') {
        return test(state.states, str.slice(i))
    }

    throw new Error('Unsupported element type');
}

const test = (states, str) => {
    const queue = states.slice();
    let i = 0;
    let currentState = queue.shift();

    while (currentState) {
        switch (currentState.quantifier) {
            case 'exactlyOne': {
                const [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i);
                if (!isMatch) {
                    return [false, i]
                }

                i += consumed;
                currentState = queue.shift();
                continue;
            }

            case 'zeroOrOne': {
                if (i >= str.length) {
                    currentState = queue.shift();
                    continue;
                }

                const [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i);

                i += consumed;
                currentState = queue.shift();
                continue;
            }

            case 'zeroOrMore': {
                let match = true;

                while (match) {
                    if (i >= str.length) break;
            
                    const [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i);
                    match = isMatch && consumed !== 0;
                    i += consumed;
                }

                currentState = queue.shift();
                continue;
            }
        }
    }
}