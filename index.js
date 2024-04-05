import parse from './parser.js'
import { inspect } from 'util';

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
    const backtrackStack = [];
    let currentState = queue.shift();

    const backtrack = () => {
        queue.unshift(currentState);
        let couldBacktrack = false;

        while (backtrackStack.length) {
            const { isBackTrackable, consumptions, state } = backtrackStack.pop();

            if (isBackTrackable) {
                if (consumptions.length === 0) {
                    queue.unshift(state);
                    continue;
                }
                const n = consumptions.pop();
                i -= n;
                backtrackStack.push({ isBackTrackable, state, consumptions });
                couldBacktrack = true;
                break;
            }

            queue.unshift(state);
            consumptions.forEach(n => {
                i -= n;
            })
        }

        if (couldBacktrack) currentState = queue.shift();

        return couldBacktrack;

    }
    //a.*c
    //accd  
    while (currentState) {
        switch (currentState.quantifier) {
            case 'exactlyOne': {
                const [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i);
                if (!isMatch) {
                    const indexBeforeBacktracking = i;
                    const couldBacktrack = backtrack();
                    if (!couldBacktrack) {
                        return [false, indexBeforeBacktracking]
                    }
                    continue;
                }

                backtrackStack.push({
                    isBackTrackable: false,
                    state: currentState,
                    consumptions: [consumed]
                })

                i += consumed;
                currentState = queue.shift();
                continue;
            }

            case 'zeroOrOne': {
                if (i >= str.length) {
                    backtrackStack.push({
                        isBackTrackable: false,
                        state: currentState,
                        consumptions: [0]
                    })

                    currentState = queue.shift();
                    continue;
                }

                const [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i);
                i += consumed;

                backtrackStack.push({
                    isBackTrackable: isMatch && consumed > 0,
                    state: currentState,
                    consumptions: [consumed]
                })

                currentState = queue.shift();
                continue;
            }

            case 'zeroOrMore': {
                const backtrackState = {
                    isBackTrackable: true,
                    state: currentState,
                    consumptions: []
                }

                let match = true;

                while (match) {
                    if (i >= str.length) break;

                    const [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i);
                    match = isMatch && consumed !== 0;
                    if (!match) break;

                    backtrackState.consumptions.push(consumed)
                    i += consumed;
                }

                if (backtrackState.consumptions.length === 0) {
                    backtrackState.consumptions.push(0);
                    backtrackState.isBackTrackable = false;
                }

                backtrackStack.push(backtrackState);
                currentState = queue.shift();
                continue;
            }

            default: {
                throw new Error('Unsupported operation')
            }
        }
    }

    return [true, i]
}

const regex = 'a'
const states = parse(regex);
const str = 'aa'
const result = test(states, str)

console.log(inspect(result, false, Infinity))