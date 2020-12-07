'use strict';

function simplifyDFA(DFA) {
  // 状态集合
  const stateSetArray = [[...DFA.endState], Reflect.ownKeys(DFA.stateMap).filter(s => !DFA.endState.includes(+s)).map(s => +s)];
  // 状态映射，状态 => stateSetIndex
  const stateSetMap = {
  };
  // 终结符集合
  const endSymbolArray = DFA.endSymbolArray;
  stateSetArray.forEach((stateSet, stateSetIndex) => {
    stateSet.forEach(state => {
      stateSetMap[state] = stateSetIndex;
    });
  });

  let oldStateSetArray = stateSetArray;
  let oldStateMap = stateSetMap;
  let newStateSetArray = [];
  let newStateMap = {};
  
  while (oldStateSetArray.length !== newStateSetArray.length) {
    if (newStateSetArray.length !== 0) {
      oldStateSetArray = newStateSetArray;
      oldStateMap = newStateMap;
    }
    newStateSetArray = [];
    newStateMap = {};

    oldStateSetArray.forEach(stateSet => {
      let tmpMap = {};
      // 终结符集遍历
      for (let i = 0; i < endSymbolArray.length; i++) {
        const endSymbol = endSymbolArray[i];
        // 状态集合遍历
        stateSet.forEach(fromState => {
          // 目标状态
          const toState = DFA.stateMap[fromState] && DFA.stateMap[fromState][endSymbol];
          if (toState !== undefined) {
            // 目标状态对应的状态集Index
            const oldSetIndex = oldStateMap[toState];
            if (tmpMap[oldSetIndex] === undefined) tmpMap[oldSetIndex] = new Set();
            tmpMap[oldSetIndex].add(fromState);
          } else {
            if (tmpMap['undefined'] === undefined) tmpMap['undefined'] = new Set();
            tmpMap['undefined'].add(fromState);
          }
        });
        // 如果集合stateSet不可区分，且不是最后一个终结符，则继续选择下一个终结符
        if (Reflect.ownKeys(tmpMap).length <= 1 && i < endSymbolArray.length - 1) {
          tmpMap = {}; // 重置tmpMap
        } else  {
          // 集合stateSet可区分或是最后一个终结符，中断for循环
          break;
        }
      }
      // 将区分后的状态集push到newStateSetArray，并做好newStateMap映射
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

  // 构造化简后的DFA
  const newDFA = {
    startState: null,
    endState: [],
    endSymbolArray: [].concat(DFA.endSymbolArray),
    stateMap: {},
  }
  // 查找包含初态的状态集Index
  const haveStartStateIndex = oldStateMap[DFA.startState];
  // 查找包含终态的状态集Index
  const haveEndStateIndexArray = DFA.endState.map(endState => {
    return oldStateMap[endState];
  });
  // let stateIndex = 0;
  // const stateIndexMapToState = {};
  // oldStateSetArray.forEach((stateSet, stateSetIndex) => {
  //   if (stateIndexMapToState[stateSetIndex] !== undefined) throw new Error(`stateIndexMapToState[${stateSetIndex}]已存在`);
  //   stateIndexMapToState[stateSetIndex] = stateSetIndex; // stateSetIndex作为新的替代状态
  // });
  // 添加新的DFA初态
  newDFA.startState = oldStateMap[DFA.startState];
  // 添加新的终态
  const endStateSet = new Set();
  DFA.endState.forEach(state => {
    endStateSet.add(oldStateMap[state]);
  });
  newDFA.endState = Array.from(endStateSet);
  // 建立新的状态映射关系
  Reflect.ownKeys(DFA.stateMap).forEach(fromState => {
    const newFromState = oldStateMap[fromState];
    if (newDFA.stateMap[newFromState] === undefined) newDFA.stateMap[newFromState] = {};
    Reflect.ownKeys(DFA.stateMap[fromState]).forEach(endSymbol => {
      const oldToState = DFA.stateMap[fromState][endSymbol];
      const newToState = oldStateMap[oldToState];
      newDFA.stateMap[newFromState][endSymbol] = newToState;
    });
  });

  return newDFA;
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
  console.log(simplifyDFA(DFA));
}

test();