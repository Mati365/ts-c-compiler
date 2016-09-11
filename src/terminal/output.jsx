const React = require('react')
    , Radium = require('radium');

@Radium
class Output extends React.Component {
  static propTypes = {
    onContextInit: React.PropTypes.func.isRequired,
  };

  componentDidMount() {
    /** Fix resolution */
    this.refs.canvas.setAttribute('width', this.refs.canvas.clientWidth);
    this.refs.canvas.setAttribute('height', this.refs.canvas.clientHeight);

    /** Load terminal */
    this.props.onContextInit(this.refs.canvas);
  }
  render() {
    return (
      <canvas ref='canvas' style={styles} />
    );
  }
}

const styles = {
  width: '100%',
  height: '440px',
  paddingTop: '40px',
  imageRendering: 'pixelated'
};

module.exports = Output;