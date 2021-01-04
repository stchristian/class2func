# Class2hook

Convert a class based react component to functional component.

## It can handle

- PureComponents gets wrapped React.memo()
- property variable declaration (not functions) get wrapped in a useRef
- state property becomes useState
- handle defaultProps & propTypes
- property declaration with arrow functions
- member methods
- getInitialProps
- componentDidMount, componentWillUnmount, componentDidUpdate
- render method (OFC)
- every statement with this.XYZ gets transformed to XYZ
- it can parse state initialization in constructor body.

## TODO:

- `emailRef = React.createRef();`
- wrap functions with `useCallback()`, maybe handle dependency array
- separate state object by keys
- clear unnecessary clean function in `useEffect()`
