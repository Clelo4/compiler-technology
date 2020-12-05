'use strict';

const none = Symbol('none');

function isEmpty(v) {
  if (v === '' ||
    v === null ||
    v === undefined) return true;
  else return false;
}

/**
 * 为NFA添加唯一的初态和终态，去除多个终结符组成的识别串
 * @param {Object} NFA 待处理的NFA
 */
function preProcess(NFA) {
  // 处理过的nfa
  const newNFA = {
    startState: 0,
    endState: -1,
    stateMap: {},
  };
  let stateAliasIndex = 0;
  const stateAliasMap = {}; // 状态=>数字 映射表
  /**
   * 获取状态别名
   * @param {any} state 状态
   */
  function getStateAlias(state) {
    if (isEmpty(state)) return ++stateAliasIndex;
    else {
      if (stateAliasMap[state]) {
        return stateAliasMap[state];
      } else {
        stateAliasMap[state]= ++stateAliasIndex;
        return stateAliasIndex;
      }
    }
  };
  // 解决初态唯一性问题
  newNFA.stateMap[newNFA.startState] = {};
  NFA.startState.forEach(state => {
    const stateAlias = getStateAlias(state);
    if (newNFA.stateMap[newNFA.startState][none] === undefined) {
      newNFA.stateMap[newNFA.startState][none] = [];
    }
    newNFA.stateMap[newNFA.startState][none].push(stateAlias);
  });
  // 处理识别串包含多个终结符的问题
  Reflect.ownKeys(NFA.stateMap).forEach(fromState => {
    const sStateMap = {};
    const beginStateAlias = getStateAlias(fromState);
    Reflect.ownKeys(NFA.stateMap[fromState]).forEach(item => { // item 为识别串
      if (typeof item === 'string') {
        if (item.length === 1) {
          sStateMap[item] = NFA.stateMap[fromState][item].map(getStateAlias);;
        } else {
          // 处理同一个识别串对于多个状态的问题
          NFA.stateMap[fromState][item].forEach(toState => {
            const endStateAlias = getStateAlias(toState);
            // 将识别串分割成单个终结符
            const subItemList = item.split('');
            const tmpStateList = [];
            for(let i = 0; i < subItemList.length - 1; i++) {
              tmpStateList.push(getStateAlias());
            }
            // 将末态加入tmpStateList
            tmpStateList.push(endStateAlias);
            let lastItem = subItemList.shift();
            if (sStateMap[lastItem] === undefined) {
              sStateMap[lastItem] = [];
            }
            let lastState = tmpStateList.shift();
            sStateMap[lastItem].push(lastState);

            let nextState = null;
            subItemList.forEach(item => {
              nextState = tmpStateList.shift();
              if (newNFA.stateMap[lastState] === undefined) {
                newNFA.stateMap[lastState] = {};
              }
              if (newNFA.stateMap[lastState][item] === undefined) newNFA.stateMap[lastState][item] = [];
              newNFA.stateMap[lastState][item].push(nextState);
              lastState = nextState;
            });
          });
        }
      } else {
        sStateMap[item] = NFA.stateMap[fromState][item].map(getStateAlias);
      }
    });
    newNFA.stateMap[beginStateAlias] = sStateMap;
  });
  // 解决终态唯一性问题
  NFA.endState.forEach(state => {
    const stateAlias = getStateAlias(state);
    if (newNFA.stateMap[stateAlias] === undefined) newNFA.stateMap[stateAlias] = {};
    if (newNFA.stateMap[stateAlias][none] === undefined) {
      newNFA.stateMap[stateAlias][none] = [];
    }
    newNFA.stateMap[stateAlias][none].push(newNFA.endState);
  });
  return newNFA;
}
/**
 * 求stateArray的ε-闭包，从状态集合stateArray出发经过任意条ε弧能到达状态集
 * @param {Object} stateMap 状态映射集
 * @param {Array}} stateArray 出发状态集合
 */
function εClosure(stateMap, stateArray) {
  // state的闭包
  const stateSet = new Set(stateArray);
  const processQueue = [].concat(stateArray);
  while (processQueue.length > 0) {
    const s = processQueue.shift();
    if (stateMap[s] && stateMap[s][none]) {
      stateMap[s][none].forEach(ss => {
        if (!stateSet.has(ss)) {
          stateSet.add(ss);
          processQueue.push(ss);
        }
      });
    }
  }
  return [...stateSet]; // 另一种写法：Array.from(stateSet);
}
/**
 * 求状态集的I closure
 * @param {Object} stateMap 状态映射表
 * @param {Array} fromStateArray 待处理的state数组
 * @param {String} a 终结符
 */
function IClosure(stateMap, fromStateArray, a) {
  if (!Array.isArray(fromStateArray) || fromStateArray.length < 1) return [];
  const toStateArray = [];
  fromStateArray.forEach(state => {
    if (stateMap[state] && stateMap[state][a] !== undefined) {
      toStateArray.push.apply(toStateArray, stateMap[state][a]);
    }
  });
  const closureStateArray = εClosure(stateMap, toStateArray);
  return closureStateArray;
}
/**
 * 
 * @param {Array} array 待排序的数组
 * @param {Number} begin 待排序数组的开头
 * @param {Number} end 待排序数组的结尾
 */
function quickSort(array, begin, end) {
  if (begin >= end) return;
  const key = array[begin];
  let i = begin;
  let j = end;
  while (i < j) {
    while (i < j && array[j] > key) {
      j--;
    }
    while (i < j && array[i] <= key) {
      i++;
    }
    if (i < j) {
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
  array[begin] = array[i];
  array[i] = key;
  quickSort(array, begin, i - 1);
  quickSort(array, i + 1, end);
}

function NFAToDFA(nfa) {
  const newNFA = preProcess(nfa);
  const startStateArray = εClosure(newNFA.stateMap, [newNFA.startState]);
  
  // 获取所有的终结符
  const endSymbolSet = new Set();
  Reflect.ownKeys(newNFA.stateMap).forEach(state => {
    Reflect.ownKeys(newNFA.stateMap[state]).forEach(endSymbol => {
      if (typeof endSymbol === 'string') endSymbolSet.add(endSymbol);
    });
  });

  let startStateIndex = 0;
  const newDFA = {
    startState: startStateIndex,
    endState: [],
    endSymbolArray: [...endSymbolSet],
    stateMap: {
    },
  };
  const stateSetMap = {};
  const setQueue = [];
  quickSort(startStateArray, 0, startStateArray.length - 1);
  setQueue.push(startStateArray);
  stateSetMap[startStateArray.join('.')] = startStateIndex++;
  while (setQueue.length > 0) {
    let currSet = setQueue.shift();
    let currStateIndex = stateSetMap[currSet.join('.')];
    if (newDFA.stateMap[currStateIndex] === undefined) newDFA.stateMap[currStateIndex] = {};
    // 求set的所有IClosure
    newDFA.endSymbolArray.forEach(endSymbol => {
      const toArray = IClosure(newNFA.stateMap, currSet, endSymbol);
      quickSort(toArray, 0, toArray.length - 1);
      let toSetKey = toArray.join('.');
      // 判断是否求过IClosure
      if (stateSetMap[toSetKey] === undefined) {
        setQueue.push(toArray);
        stateSetMap[toSetKey] = startStateIndex;
        // 判断是否是终态
        if (toArray[0] === -1) {
          newDFA.endState.push(startStateIndex);
        }
        startStateIndex++;
      }
      newDFA.stateMap[currStateIndex][endSymbol] = stateSetMap[toSetKey];
    });
  }
  return newDFA;
}

function test() {
  let nfaTest = {
    startState: ['1'],
    endState: ['4'],
    stateMap: {
       '1': {
        a: ['1'],
        [none]: ['2'],
        b: ['1'],
      },
      '2': {
        aa: ['3'],
        bb: ['3'],
      },
      '3': {
        [none]: ['4'],
      },
      '4': {
        a: ['4'],
        b: ['4'],
      },
    },
  };
  console.log(NFAToDFA(nfaTest))
}

module.exports = {
  NFAToDFA,
  NFAToDFATest: test,
};

test();
