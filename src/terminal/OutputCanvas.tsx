import React from 'react';

type OutputCanvasProps = {
  onContextInit: (node?: HTMLCanvasElement) => void;
};

export class OutputCanvas extends React.Component<OutputCanvasProps> {
  private canvasRef = React.createRef<HTMLCanvasElement>();

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
