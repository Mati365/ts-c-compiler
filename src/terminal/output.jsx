import React from 'react';
import PropTypes from 'prop-types';
import Radium from 'radium';

export default
@Radium
class Output extends React.Component {
  canvasRef = React.createRef();

  static propTypes = {
    onContextInit: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const {canvasRef, props} = this;

    /** Load terminal */
    props.onContextInit(canvasRef.current);
  }

  render() {
    const {canvasRef} = this;

    return (
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          margin: '0 auto',
          paddingTop: '40px',
          imageRendering: 'pixelated',
        }}
      />
    );
  }
}
