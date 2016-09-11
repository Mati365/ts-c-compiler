const React = require('react')
    , { Grid, Row, Col } = require('react-flexbox-grid');

class Debugger extends React.Component {
  static propTypes = {
    cpu: React.PropTypes.object.isRequired,
  };

  render() {
    return (
      <Grid>
        <Row>
          <Col xs={6} md={3}>Hello, world!</Col>
        </Row>
      </Grid>
    );
  }
}

module.exports = Debugger;