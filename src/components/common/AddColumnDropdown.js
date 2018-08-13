import React from 'react';
import { Popover, Overlay, Button, ButtonToolbar, Dropdown, MenuItem, FormGroup, FormControl, Glyphicon } from 'react-bootstrap';
import firebase from '../../helpers/base';

const typeIcons = {
  1: 'font',
  2: 'subscript',
  3: 'check',
  4: 'calendar',
  5: 'th-list',
  6: 'collapse-down',
  7: 'link',
  8: 'pencil',
  9: 'transfer',
  10: 'search'
}
const allDataTypes = {
  1: 'Text',
  2: 'Number',
  3: 'Checkbox',
  4: 'Date',
  5: 'Multiple select',
  6: 'Single select',
  7: 'URL',
  8: 'Formula',
  9: 'Link to another record',
  10: 'Lookup'
}
export default class AddColumnDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.getInput = this.getInput.bind(this);
    this.getTypeList = this.getTypeList.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.onCloseClick = this.onCloseClick.bind(this);
    this.onSaveClick = this.onSaveClick.bind(this);
    this.addColumn = this.addColumn.bind(this);
    this.setType = this.setType.bind(this);

    this.state = {
      dropdownOpen: false,
      dataTypeDropdown: false,
      name: '',
      type: 'Find a field type',
      type_id: 1,
      resultDataTypes:{},
      table_list: [],
      link_table: 'Select a table',
      selected_column: 'Select a column'
    };
  }

  componentDidMount() {
    this.setState({ resultDataTypes: allDataTypes })

    const { table = '' } = this.props;
    this.views_ref = firebase.ref().child('views').child(table);
    this.views_ref.on('value', (snapshot) => {
      const views_data = snapshot.val();
      const { currentView = '' } = this.props
      const { allViews = {} } = views_data ? views_data : {}
      this.setState({
        viewState: allViews[currentView]['state'],
        linkState: allViews[currentView]['link']
      })
    })
  }

  setType(type, type_id) {
    const that = this;
    let table_list = [];
    if(type_id === "9") {
      firebase.ref().once('value').then(function(snapshot) {
        if (snapshot.val() !== null) {
          table_list = Object.keys(snapshot.val());
          delete table_list[table_list.indexOf('views')]
          that.setState({ type, type_id, table_list })
        }
      })
    } else {
      this.setState({ type, type_id, link_table: 'Select a table' })
    }
  }

  setColumn(link_table) {
    const that = this;
    let column_list = [];

    this.views_ref = firebase.ref().child('views').child(link_table);
    this.views_ref.on('value', (snapshot) => {
      const views_data = snapshot.val();
      const { allViews = {} } = views_data ? views_data : {};
      const { currentView = '' } = this.props
      const viewState = allViews[currentView]['state'];

      const table_state = JSON.parse(viewState)
      const column_state = JSON.parse(table_state.columnLayout)

      column_state.columns.map(column_item => {
        column_list.push(column_item.binding);
      })
      delete column_list[column_list.indexOf('sel_for_deletion')];

      that.setState({ link_table, column_list, selected_column: 'Select a column' });
    })
  }

  getTypeList() {
    return (
      <div id="type-dropdown-content">
        {
          <Dropdown id="type-list-dropdown">
            <Dropdown.Toggle>
              <Glyphicon glyph={typeIcons[this.state.type_id]} />
              {' ' + this.state.type}
            </Dropdown.Toggle>
            <Dropdown.Menu className="super-colors">
              {
                Object.keys(this.state.resultDataTypes).map(type_id => {
                  const type = this.state.resultDataTypes[type_id]
                  const selected = this.state.type == type
                  return (
                    <MenuItem key={type_id} eventKey={type_id} onClick={() => this.setType(type, type_id)}>
                      <Glyphicon glyph={typeIcons[type_id]} />
                      { ' ' + type + ' ' }
                      {selected && <span className="glyphicon glyphicon-ok text-success" aria-hidden="true"></span>}
                    </MenuItem>
                  )
                })
              }
            </Dropdown.Menu>
          </Dropdown>
        }
      </div>
    )
  }

  getTableList() {
    const { table_list, link_table } = this.state;
    return (
      <div id="table-dropdown-content">
      {
        <Dropdown id="table-list-dropdown">
          <Dropdown.Toggle>
            {link_table}
          </Dropdown.Toggle>
          <Dropdown.Menu className="super-colors">
            {
              table_list.map(table => {
                const selected = link_table == table
                return (
                  <MenuItem key={table} eventKey={table} onClick={() => this.setColumn(table)}>
                    { table + ' ' }
                    {selected && <span className="glyphicon glyphicon-ok text-success" aria-hidden="true"></span>}
                  </MenuItem>
                )
              })
            }
          </Dropdown.Menu>
        </Dropdown>
      }
      </div>
    )
  }

  getColumnList() {
    const { column_list, selected_column } = this.state;
    return (
      <div id="table-dropdown-content">
      {
        <Dropdown id="table-list-dropdown">
          <Dropdown.Toggle>
            {selected_column}
          </Dropdown.Toggle>
          <Dropdown.Menu className="super-colors">
            {
              column_list.map(column => {
                const selected = selected_column == column
                return (
                  <MenuItem key={column} eventKey={column} onClick={() => this.setState({ selected_column: column})}>
                    { column + ' ' }
                    {selected && <span className="glyphicon glyphicon-ok text-success" aria-hidden="true"></span>}
                  </MenuItem>
                )
              })
            }
          </Dropdown.Menu>
        </Dropdown>
      }
      </div>
    )
  }

  onSubmit(e) {
    e.preventDefault()
  }

  getInput() {
    const { validationState = {} } = this.state
    return (
      <form id="addColumnForm" onSubmit={this.onSubmit}>
        <FormGroup
          controlId="formBasicText"
          validationState={validationState.status}
        >
          <FormControl
            type="text"
            autoComplete="off"
            value={this.state.name}
            placeholder="Enter Data Name"
            onChange={(e) => this.setState({ name: e.target.value })}
          />
          <div className="mt5">{validationState.text}</div>
        </FormGroup>
      </form>
    )
  }

  handleClick(e) {
    this.setState({
      target: e.target,
      dropdownOpen: !this.state.dropdownOpen,
      resultDataTypes: allDataTypes,
      name: '',
      type: 'Find a field type' ,
      type_id: 0,
      link_table: 'Select a table',
      selected_column: 'Select a column'
    });
  };

  addColumn(name, type_id, link_table='', selected_column='') {
    const that = this;
    const { table = '', currentView = '' } = this.props;
    const { viewState = '', linkState=''} = this.state
    const table_state = JSON.parse(viewState)
    const column_state = JSON.parse(table_state.columnLayout)

    const insert_data = {
      dataType: type_id<5 ? type_id : 1,
      binding: name.toLowerCase(),
      width: 150,
      header: name
    }

    if(type_id == 4) { //date
      insert_data.width = 200;
    }

    if(type_id == 9) {
      insert_data.width = 250;

      let link_state = linkState!=='' ? JSON.parse(linkState) : [];
      link_state.push({
        binding: name.toLowerCase(),
        table: link_table,
        column: selected_column
      })
      firebase.ref().child('views').child(table).child('allViews')
      .child(currentView).child('link').set(JSON.stringify(link_state));
    }

    column_state.columns.push(insert_data);
    table_state.columnLayout = JSON.stringify(column_state);
    firebase.ref().child('views').child(table).child('allViews')
      .child(currentView).child('state').set(JSON.stringify(table_state));
  }

  onCloseClick() {
    this.setState({
      dropdownOpen: false,
      name: '',
      type: 'Find a field type',
      type_id: 0,
      resultDataTypes: allDataTypes,
      link_table: 'Select a table',
      selected_column: 'Select a column'
    });
  };

  onSaveClick() {
    const { name, type_id, link_table, selected_column } = this.state;
    this.addColumn(name, parseInt(type_id), link_table, selected_column);
    this.setState({ dropdownOpen: false,
      name: '',
      type: 'Find a field type',
      type_id: 0,
      resultDataTypes: allDataTypes,
      link_table: 'Select a table',
      selected_column: 'Select a column'
    });
  }

  render() {
    const { allViews = {}, isChangingView = false } = this.state;
    const { currentView = 'default' } = this.props
    const { name, type_id, link_table, selected_column } = this.state;
    const dropdown_text = allViews[currentView] ? allViews[currentView]['name'] : 'Select a view';
    const saveBtnDisabled = name==""||type_id==0||(type_id==9&&link_table=='Select a table')||
      (type_id==9&&link_table!='Select a table'&&selected_column=='Select a column');
    return (
      <ButtonToolbar className="pull-right" style={{'position': 'relative'}}>
        <Button id='show_view' className="pull-right btn btn-default mb10 mr15" onClick={this.handleClick}>Add Column</Button>
        <Overlay show={this.state.dropdownOpen} target={this.state.target} placement="bottom" container={this} containerPadding={20}>
          <Popover id="add-column-popover-views" className="view_dropdown" style={{width: '250px', left: '-10px !improtant'}}>
            {this.getInput()}
            {this.getTypeList()}
            {this.state.type_id == '9'?this.getTableList():null}
            {this.state.link_table !== 'Select a table'?this.getColumnList():null}
            <div className="clearfix" style={{marginTop: '15px'}}>
              <Button id='show_view' className="pull-right btn btn-default mr15" bsStyle="primary" style={{'marginRight': '0'}}
                onClick={this.onSaveClick} disabled={saveBtnDisabled}>Save</Button>
              <Button id='show_view' className="pull-right btn btn-default mr15" onClick={this.onCloseClick}>Cancel</Button>
            </div>
          </Popover>
        </Overlay>
      </ButtonToolbar>
    );
  }
}
