/**
 * Terminal component
 */
const React = require('react')
    , ReactDOM = require('react-dom')
    , Radium = require('radium');

@Radium
class Terminal extends React.Component {
  render() {
    return <div></div>;
  }
}

/** Init terminal */
ReactDOM.render(
  <Terminal />,
  document.body.appendChild(document.createElement('div'))
);