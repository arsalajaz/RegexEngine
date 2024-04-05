/**
 * @param {string} s
 * @param {string} p
 * @return {boolean}
 */


 // [a-z]*@[a-z]*.[com]||[net]||...
 var isMatch = function(s, p) {
    let states = [];
    let index = 0;

    while(true) {
        if(index >= p.length) break;
        let char = p[index];

        switch(char) {
            case '.': {
                states.push({
                    quantifier: 'exactlyOne',
                    type: 'wildcard'
                });
                index++;
                continue;
            }
            case '*': {
                let lastState = states.pop();
                if(!lastState) {
                    throw new Error("Invalid expr")
                }
                states.push({...lastState, quantifier: 'zeroOrMore'});
                index++;
                continue;

            }
            default: {
                states.push({type: 'element', quantifier: 'exactlyOne', value: char});
                index++;
                continue;
            }
        }
    };

    let currState = states.shift();
    const backtrackStack = [];
    index = 0;

    const backtrack = () => {
        states.unshift(currState);

        while(backtrackStack.length) {
            const {isBackTrackable, state, consumptions} = backtrackStack.pop();

            if(isBackTrackable && consumptions.length !== 0) {
                const x = consumptions.pop();
                index -= x;
                backtrackStack.push({isBackTrackable, state, consumptions})
                currState = states.shift();
                return true;
            }

            states.unshift(state);
            consumptions.forEach((x) => {index -= x})
        }

        return false;
    }

    while(currState) {

        switch(currState.quantifier) {
            case 'exactlyOne': {
                let [match, consumed] = stringMatch(currState, s, index)
                if(!match) {
                    if(backtrack()) {
                        continue;
                    }
                    return false
                }

                backtrackStack.push({isBackTrackable: false, state: currState, consumptions: [consumed]})
                index += consumed;
                currState = states.shift();
                continue;
            }
            case 'zeroOrMore': {
                let defaultState = {isBackTrackable: true, state: currState, consumptions: []}
                while(true) {
                    let [match, consumed] = stringMatch(currState, s, index);

                    if(!match) break;
                    index += consumed;
                    defaultState.consumptions.push(consumed);
                }

                if(defaultState.consumptions.length === 0) {
                    defaultState.isBackTrackable = false;
                }

                backtrackStack.push(defaultState)

                currState = states.shift();
                continue;
            }
            default: {
                throw new Error('Invalid type')
            }
        }


    }

    return index >= s.length;
};

let stringMatch = (state, str, i) => {
    if(i >= str.length) return [false, 0];
    if(state.type === 'element') {
        let match = state.value === str[i]
        return [match, match ? 1 : 0]
    }
    if(state.type === 'wildcard') {
        return [true, 1]
    }
}