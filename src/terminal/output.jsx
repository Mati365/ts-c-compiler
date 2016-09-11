const React = require('react')
    , Radium = require('radium');

@Radium
class Output extends React.Component {
  static propTypes = {
    onContextInit: React.PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.props.onContextInit(
      this.refs.canvas.getContext('2d')
    );
  }
  render() {
    return (
      <canvas ref='canvas' style={styles} />
    );
  }
}

const styles = {
  width: '100%',
  height: '400px',
  background: 'FFF'
};

module.exports = Output;