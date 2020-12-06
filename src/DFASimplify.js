'use strict';

function simplifyDFA(DFA) {
  const stateSetArray = [[...DFA.endState], Reflect.ownKeys(DFA.stateMap).filter(s => !DFA.endState.includes(+s)).map(s => +s)];
  const stateSetMap = {
  };
  stateSetArray.forEach((stateSet, stateSetIndex) => {
    stateSet.forEach(state => {
      stateSetMap[state] = stateSetIndex;
    });
  });

  const newStateSetArray = [];
  stateSetArray.forEach(stateSet => {
    DFA.endSymbolArray.forEach(endSymbol => {
      stateSet.forEach(state => {
      });
    });
  });
}

function test() {
  const DFA = { startState: 0,
    endState: [ 3, 4, 5, 6 ],
    endSymbolArray: [ 'a', 'b' ],
    stateMap:
      { '0': { a: 1, b: 2 },
        '1': { a: 3, b: 2 },
        '2': { a: 1, b: 4 },
        '3': { a: 3, b: 5 },
        '4': { a: 6, b: 4 },
        '5': { a: 6, b: 4 },
        '6': { a: 3, b: 5 },
    },
  };
  simplifyDFA(DFA);
}

test();