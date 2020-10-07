
const updateParserState = (state, index, result) => ({
  ...state,
  index,
  result
})

const updateParserResult = (state, result) => ({
  ...state,
  result
})

const updateParserError = (state, errorMsg) => ({
  ...state,
  isError: true,
  error: errorMsg
})

class Parser {
  constructor(parserStateTransformerFn) {
    this.parserStateTransformerFn = parserStateTransformerFn
  }

  run(targetString) {
    const initialState = {
      targetString,
      index: 0,
      result: null,
      isError: false,
      error: null
    }
    return this.parserStateTransformerFn(initialState)
  }

  map(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) return nextState;

      return updateParserResult(nextState, fn(nextState.result))
    })
  }


  errorMap(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (!nextState.isError) return nextState;

      return updateParserResult(nextState, fn(nextState.error, nextState.index))
    })
  }
}


const str = s => new Parser(parserState => {
  const { targetString, index, isError } = parserState

  if (isError) return parserState

  const sliceTarget = targetString.slice(index)

  if (sliceTarget.length === 0) {
    return updateParserError(parserState, `str: Unexpected end of input. Tried to match "${s} but got"${sliceTarget}" "`)
  }

  if (sliceTarget.startsWith(s)) {
    // success!
    return updateParserState(parserState, index + s.length, s)
  }

  return updateParserError(parserState, `tried to match "${s}" but got "${targetString.slice(index, index + 10)}"`)
})

const lettersRegex = /^[a-zA-Z]+/

const letters = new Parser(parserState => {
  const { targetString, index, isError } = parserState

  if (isError) return parserState

  const sliceTarget = targetString.slice(index)

  if (sliceTarget.length === 0) {
    return updateParserError(parserState, `letters: Unexpected end of input`)
  }

  const regexMatch = sliceTarget.match(lettersRegex)

  if (regexMatch) {
    // success!
    return updateParserState(parserState, index + regexMatch[0].length, regexMatch[0])
  }

  return updateParserError(parserState, `letters: Couldn't match letters at index ${index}`)
})

const digitsRegex = /^[0-9]+/

const digits = new Parser(parserState => {
  const { targetString, index, isError } = parserState

  if (isError) return parserState

  const sliceTarget = targetString.slice(index)

  if (sliceTarget.length === 0) {
    return updateParserError(parserState, `digits: Unexpected end of input`)
  }

  const regexMatch = sliceTarget.match(digitsRegex)

  if (regexMatch) {
    // success!
    return updateParserState(parserState, index + regexMatch[0].length, regexMatch[0])
  }

  return updateParserError(parserState, `digits: Couldn't match digits at index ${index}`)
})

const sequenceOf = parsers => new Parser(parserState => {
  if (parserState.isError) return parserState;

  const results = [];
  let nextState = parserState
  for (let p of parsers) {
    nextState = p.parserStateTransformerFn(nextState)
    results.push(nextState)
  }

  return updateParserResult(nextState, results)
})

const choice = parsers => new Parser(parserState => {
  if (parserState.isError) return parserState;

  for (let p of parsers) {
    const nextState = p.parserStateTransformerFn(parserState)
    if (!nextState.isError) return nextState;

  }

  return updateParserError(
    parserState,
    `choice: Unable to match with any parser at index: ${parserState.index}`
  );
})

const many = parser => new Parser(parserState => {
  if (parserState.isError) return parserState;

  let nextState = parserState
  const results = []
  let done = false;

  while (!done) {
    const testState = parser.parserStateTransformerFn(nextState)

    if (!testState.isError) {
      results.push(testState.result)
      nextState = testState
    } else {
      done = true;
    }
  }

  return updateParserResult(nextState, results)
})

const manyOne = parser => new Parser(parserState => {
  if (parserState.isError) return parserState;

  let nextState = parserState
  const results = []
  let done = false;

  while (!done) {
    const testState = parser.parserStateTransformerFn(nextState)

    if (!testState.isError) {
      results.push(testState.result)
      nextState = testState
    } else {
      done = true;
    }
  }

  if (results.length === 0) {
    return updateParserError(
      parserState,
      `manyOne: Unable to match any input using parser @ index ${parserState.index}`
    )
  }
  return updateParserResult(nextState, results)
})


const parser = many(
  choice([
    digits,
    letters
  ])
).map(results => [...results].reverse())

// Single Run
console.log(parser.run("123asdf"))

