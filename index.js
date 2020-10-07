
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

const str = s => parserState => {
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
}

const sequenceOf = parsers => parserState => {
  const results = [];

  let nextState = parserState
  for (let p of parsers) {
    nextState = p(nextState)
    results.push(nextState)
  }

  return updateParserResult(nextState, results)
}

const run = (parser, targetString) => {
  const initialState = {
    targetString, index: 0,
    result: null,
    isError: false,
    error: null
  }
  return parser(initialState)
}


const parser = sequenceOf([
  str('hello there!'),
  str('goodbye there!'),
  str(""),
])
// Single Run
console.log(run(parser, "hello there!goodbye there!"))

