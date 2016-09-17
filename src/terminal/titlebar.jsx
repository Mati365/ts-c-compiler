const React = require('react')
    , Radium = require('radium')
    , { Icon } = require('react-fa');

@Radium
class TitleBar extends React.Component {
  render() {
    return (
      <div style={styles.bar}>
        <span style={styles.title}> x86 emulator </span>
        <div style={styles.buttons}>
          <Icon name='times-circle' style={styles.button} onClick={window.close} />
        </div>
      </div>
    );
  }
}

const styles = {
  bar: {
    position: 'relative',
    fontSize: '20px',
    color: '#FFF',
    textAlign: 'center'
  },
  buttons: {
    position: 'absolute',
    right: 5,
    top: 5,
    '-webkit-app-region': 'no-drag'
  },
  button: {
    margin: '0 2px',
    ':hover': {
      cursor: 'pointer'
    }
  },
  title: {
    fontSize: '15px',
    marginRight: '10px'
  }
};

module.exports = TitleBar;