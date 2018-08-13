import React from 'react';
import { Popover, ListGroup, Overlay, Button, ButtonToolbar, Checkbox, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { CollectionView } from 'wijmo/wijmo';
import DropDownItem from './DropDownItem';
import firebase from '../../helpers/base';
import _ from 'lodash';

export default class DeleteColumnDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.onCloseClick = this.onCloseClick.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.getColumnList = this.getColumnList.bind(this);
    this.updateColumnState = this.updateColumnState.bind(this);

    this.state = {
      dropdownOpen: false
    };
  }

  componentDidMount() {
    const { table = '' } = this.props;
    this.views_ref = firebase.ref().child('views').child(table);
    this.views_ref.on('value', (snapshot) => {
      const views_data = snapshot.val();
      const { currentView = 'default' } = this.props
      const { allViews = {} } = views_data ? views_data : {};
      const viewState = allViews[currentView]['state'];
      let table_state = JSON.parse(viewState);
      table_state = table_state ? table_state : {}
      const column_state = JSON.parse(table_state.columnLayout);
      const column_list = [];
      column_state.columns.map(column_item => {
        if(column_item.binding != 'id' && column_item.binding != 'sel_for_deletion') {
          column_list.push({
            column: column_item.binding,
            state: false
          });
        }
      });

      this.setState({
        viewState: allViews[currentView]['state'],
        linkState: allViews[currentView]['link'],
        columnList: column_list
      });
    })
  }

  updateColumnState(e) {
    let column_name = e.target.value;
    let newColumnList = [];
    this.state.columnList.forEach(columnItem => {
      newColumnList.push({
        column: columnItem.column,
        state: columnItem.column==column_name?!columnItem.state:columnItem.state
      })
    });
    this.setState({ columnList: newColumnList });
  }

  getColumnList() {
    const { columnList = [] } = this.state;
    return (
      <div className="column-list-wrapper">
        <ListGroup componentClass="ul" className="dropdown-list-items">
          {
            columnList.map(columnItem => {
              let columnName = columnItem.column;
              return (
                <DropDownItem key={columnName}>
                  <Checkbox id={columnName} value={columnName} onChange={(e) => this.updateColumnState(e)}>{columnName}</Checkbox>
                </DropDownItem>
              )
            })
          }
        </ListGroup>
      </div>
    )
  }

  handleClick(e) {
    this.setState({ target: e.target, dropdownOpen: !this.state.dropdownOpen });
  };

  onCloseClick() {
    this.setState({ dropdownOpen: false });
  };

  deleteColumns(selectedColumns) {
    const { table = '', currentView = 'default' } = this.props;
    const { viewState = '' } = this.state;
    const table_state = JSON.parse(viewState);
    const column_state = JSON.parse(table_state.columnLayout);
    let newColumns = column_state.columns;
    selectedColumns.map(sel_column => {
      newColumns = _.filter(newColumns, item => { return item.binding !== sel_column });
    });
    column_state.columns = newColumns;
    table_state.columnLayout = JSON.stringify(column_state);
    firebase.ref().child('views').child(table).child('allViews')
      .child(currentView).child('state').set(JSON.stringify(table_state));
  }

  deleteColumnData(selectedColumns) {
    const { table = '' } = this.props;
    this.store_ref = firebase.ref().child(table);
    this.store_ref.on('value', (snapshot) => {
      const projects_obj = snapshot.val();
      Object.keys(projects_obj).map(id => {
        selectedColumns.map(sel_column => {
          delete projects_obj[id][sel_column];
        });
      });
      firebase.ref().child(table).set(projects_obj);
    })
  }

  deleteLinkData(selectedColumns) {
    const { table = '',  currentView = '' } = this.props;
    const { linkState = '{}' } = this.state;
    const link_state = JSON.parse(linkState);
    let newLinkState = link_state;
    selectedColumns.map(sel_column => {
      newLinkState = _.filter(newLinkState, item => { return item.binding !== sel_column });
    });
    firebase.ref().child('views').child(table).child('allViews')
      .child(currentView).child('link').set(JSON.stringify(newLinkState));
  }

  onDeleteClick() {
    const { columnList = [] } = this.state;
    let selected_columns = [];
    _.filter(columnList, 'state').map(item => {
      selected_columns.push(item.column);
    });

    this.deleteColumns(selected_columns);
    this.deleteColumnData(selected_columns);
    this.deleteLinkData(selected_columns);

    this.setState({ dropdownOpen: false });
  }

  render() {
    const { columnList = [] } = this.state;
    let delBtnDisabled = _.filter(columnList, 'state').length == 0;
    return (
      <ButtonToolbar className="pull-right" style={{'position': 'relative'}}>
        <Button id='show_view' className="pull-right btn btn-default mb10 mr15" onClick={this.handleClick}>Delete Column</Button>
        <Overlay show={this.state.dropdownOpen} target={this.state.target} placement="bottom" container={this} containerPadding={20}>
          <Popover id="delete-column-popover-views" className="view_dropdown" style={{width: '250px', left: '-10px !improtant'}}>
            {this.getColumnList()}
            <div className="clearfix" style={{marginTop: '15px'}}>
              <Button id='show_view' className="pull-right btn btn-default mr15" bsStyle="primary" style={{'marginRight': '0'}}
                onClick={this.onDeleteClick} disabled={delBtnDisabled}>Delete</Button>
              <Button id='show_view' className="pull-right btn btn-default mr15" onClick={this.onCloseClick}>Cancel</Button>
            </div>
          </Popover>
        </Overlay>
      </ButtonToolbar>
    );
  }
}
