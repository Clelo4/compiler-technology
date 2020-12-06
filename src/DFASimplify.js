'use strict';

function getEndSymbol(endSymbolArray) {
  const index = +(Math.random() * (endSymbolArray.length)).toFixed(0);
  return endSymbolArray[index];
}

function simplifyDFA(DFA) {
  const getES = getEndSymbol.bind(null, DFA.endSymbolArray);
  // 状态集合
  const stateSetArray = [[...DFA.endState], Reflect.ownKeys(DFA.stateMap).filter(s => !DFA.endState.includes(+s)).map(s => +s)];
  // 状态映射，状态 => stateSetIndex
  const stateSetMap = {
  };
  stateSetArray.forEach((stateSet, stateSetIndex) => {
    stateSet.forEach(state => {
      stateSetMap[state] = stateSetIndex;
    });
  });

  let oldStateSetArray = stateSetArray;
  let olStateMap = stateSetMap;
  let newStateSetArray = [];
  let newStateMap = {};
  
  while (oldStateSetArray.length !== newStateSetArray.length) {
    if (newStateSetArray.length !== 0) {
      oldStateSetArray = newStateSetArray;
      olStateMap = newStateMap;
    }
    newStateSetArray = [];
    newStateMap = {};

    const endSymbol = getES();
    oldStateSetArray.forEach(stateSet => {
      let tmpMap = {};
      stateSet.forEach(fromState => {
        const toState = DFA.stateMap[fromState] && DFA.stateMap[fromState][endSymbol];
        if (toState !== undefined) {
          const oldSetIndex = olStateMap[toState];
          if (tmpMap[oldSetIndex] === undefined) tmpMap[oldSetIndex] = new Set();
          tmpMap[oldSetIndex].add(fromState);
        } else {
          if (tmpMap['undefined'] === undefined) tmpMap['undefined'] = new Set();
          tmpMap['undefined'].add(fromState);
        }
      });
      Reflect.ownKeys(tmpMap).forEach(setIndex => {
        let newStateSetIndex = newStateSetArray.length;
        let setArray = Array.from(tmpMap[setIndex]);
        setArray.forEach(state => {
          newStateMap[state] = newStateSetIndex;
        });
        newStateSetArray.push(setArray);
      });
      tmpMap = {};
    });
  }
  return oldStateSetArray;
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