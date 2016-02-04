import React, {
  Component,
  View,
  Text,
  ListView,
  StyleSheet
} from 'react-native';

import NavBar from '../NavBar/NavBar';
import NavBarImageButton from '../NavBar/NavBarImageButton';
import IssueRow from '../Issue/IssueRow';
import IssueDetail from '../Issue/IssueDetail';

import {findIssues} from '../../helpers/issue';
import {calculateBoundingBox, comparePositions} from '../../helpers/map';

const POSITION_UNKNOWN = 'unknown';
const PAGE_SIZE = 20;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#DFDEDE',
    borderBottomWidth: 1,
    borderRightColor: '#DFDEDE',
    borderRightWidth: 1,
    borderTopColor: '#DFDEDE',
    borderTopWidth: 1,
    flex: 1,
    marginTop: 80
  },
  separator: {
    backgroundColor: '#DFDEDE',
    height: 1
  }
});

class IssueList extends Component {
  constructor() {
    super();

    this.watchID = null;
    this.previousPosition = null;

    this.state = {
      position: POSITION_UNKNOWN,
      dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
      pageNumber: 0
    };
  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      position => {
        if (position) {
          this.setState({position});
        }
      },
      error => alert(error.message),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
    );

    this.watchID = navigator.geolocation.watchPosition(position => {
      if (position) {
        this.setState({position});
      }
    });
  }

  componentDidUpdate() {
    if (this.hasLocationChanged()) {
      this.loadIssues(this.state.pageNumber);
      this.previousPosition = this.state.position;
    }
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchID);
  }

  hasLocationChanged() {
    return !this.previousPosition || comparePositions(this.previousPosition, this.state.position);
  }

  loadIssues() {
    if (this.state.position) {
      findIssues({
        bbox: calculateBoundingBox(this.state.position.coords, 1),
        offset: PAGE_SIZE * (this.state.pageNumber - 1),
        limit: PAGE_SIZE
      })
        .then(result => {
          if (result.data.objects) {
            this.setState({
              dataSource: this.state.dataSource.cloneWithRows(result.data.objects),
              pageNumber: this.state.pageNumber + 1
            });
          }
        })
        .catch(err => alert(err));
    }
  }

  handlePress(issue) {
    this.props.navigator.push({
      component: IssueDetail,
      passProps: {
        issue: issue,
        position: this.state.position
      }
    });
  }

  render() {
    const position = this.state.position;

    return (
      <View style={styles.container}>
        <NavBar title={{ title: 'PÄÄTÖKSET' }} />
        <ListView
          dataSource={this.state.dataSource}
          renderRow={issue => <IssueRow issue={issue} position={position} onPress={this.handlePress.bind(this)} />}
          renderSeparator={(sectionID, rowID) => <View key={`${sectionID}-${rowID}`} style={styles.separator} />}
          onEndReached={this.loadIssues.bind(this)}
        />
      </View>
    );
  }
}

export default IssueList;
