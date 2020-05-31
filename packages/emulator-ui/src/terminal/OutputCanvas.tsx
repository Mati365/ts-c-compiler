import React from 'react';

type OutputCanvasProps = {
  onContextInit: (node?: HTMLDivElement) => void;
};

export class OutputCanvas extends React.Component<OutputCanvasProps> {
  private screenRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    const {screenRef, props} = this;

    /** Load terminal */
    props.onContextInit(screenRef.current);
  }

  render() {
    const {screenRef} = this;

    return (
      <div
        ref={screenRef}
        style={{
          display: 'block',
          margin: '0 auto',
          paddingTop: '40px',
          imageRendering: 'pixelated',
          textAlign: 'center',
        }}
      />
    );
  }
}
