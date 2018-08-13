import React from 'react';
import { Popover, ListGroup, OverlayTrigger, Button, FormGroup, ControlLabel, FormControl, Glyphicon } from 'react-bootstrap';
import DropDownItem from './DropDownItem'
import firebase from '../../helpers/base';
import { slugify } from '../../helpers';
import mongoObjectId from '../../helpers/mongoId';

export default class ViewsDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.getInput = this.getInput.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.getListItems = this.getListItems.bind(this);
    this.setCurrentView = this.setCurrentView.bind(this);
    this.addView = this.addView.bind(this);
    this.state = {
      dropdownOpen: false,
      text: '',
      allViews: {},
      resultViews: {}
    };
  }

  componentDidMount() {
    const { table = '' } = this.props;
    this.store_ref = firebase.ref().child('views').child(table)
    this.store_ref.on('value', (snapshot) => {
      const views_data = snapshot.val();
      const { allViews={} } = views_data ? views_data : {}
      this.setState({
        ...views_data,
        resultViews: allViews
      })
    })
  }

  setCurrentView(view_id, e) {
    const { table = '', saveState, setCurrentViewId } = this.props
    // const updated_item = view_id
    // const updates = {}
    // updates[`/views/${table}/currentView` ] = updated_item
    document.getElementById('show_view').click()
    this.setState({
      isChangingView: true
    }, () => {

      saveState()
      // firebase.ref().update(updates)
      .then(() => {
        this.setState({
          isChangingView: false
        }, () => {
          setCurrentViewId(view_id)
        })
      })
    })
  }

  isValidText(text = '') {
    if (text.length == 0 || text.length > 15) {
      this.setState({
        validationState: {
          status: 'error',
          text: 'View name length should be between 1-15 characters'
        }
      })
      return false
    } else {
      const { allViews = {} } = this.state;
      const is_duplicate = Object.values(allViews).some(view => view['name'] == text)
      if (is_duplicate) {
        this.setState({
          validationState: {
            status: 'error',
            text: `${text} already exists`
          }
        })
        return false
      }
    }
    return true;
  }

  handleChange(e) {
    const { value = '' } = e.target;
    if (value.length > 15) {
      this.isValidText(value)
      return
    }
    const { allViews = {} } = this.state;
    const result_view_ids = Object.keys(allViews).filter(view_id => {
      return allViews[view_id]['name'].toLowerCase().indexOf(value.toLowerCase()) !== -1
    })
    const resultViews = {};
    result_view_ids.map(id => {
      resultViews[id] = allViews[id]
    })
    this.setState({ text: value, resultViews, validationState: {}});
  }

  getListItems() {
    const {resultViews = {}, allViews, text} = this.state;
    const { currentView = 'default' } = this.props
    const show_empty = text && Object.keys(allViews).some(key => allViews[key]['name'] !== text)
    return (
      <div className="list-group-wrapper">
        {
          <ListGroup componentClass="ul" className="dropdown-list-items">
            {
              Object.keys(resultViews).map(view_id => {
                const { name = '' } = resultViews[view_id]
                const selected = currentView == view_id
                return (
                  <DropDownItem key={view_id} onClick={this.setCurrentView.bind(this, view_id)}>
                    { name + ' ' }
                    {selected && <span className="glyphicon glyphicon-ok text-success" aria-hidden="true"></span>}
                  </DropDownItem>
                )
              })
            }
          </ListGroup>
        }
        {show_empty && `Hit enter to add "${this.state.text}"`}
      </div>
    )
  }

  onSubmit(e) {
    e.preventDefault()
  }

  addView(e) {
    const { text = '', resultViews = {}, allViews = {} } = this.state
    const { currentView = 'default', setCurrentViewId } = this.props
    const { table = '', saveState } = this.props
    if (e.key == 'Enter') {
      if (!this.isValidText(text)) {
        return
      }

      saveState()
      .then((current_view_data) => {
        const new_view = {state: JSON.stringify(current_view_data), name: text}
        const new_view_id = 'view-' + mongoObjectId()
        const updates = {}
        updates[`/views/${table}/allViews/${new_view_id}` ] = new_view
        // updates[`/views/${table}/currentView` ] = new_view_id
        return firebase.ref().update(updates).then(() => new_view_id)
      })
      .then((new_view_id) => {
        this.setState({
          text: ''
        }, () => {
          setCurrentViewId(new_view_id)
        })
      })
    }
  }

  getInput() {
    const { validationState = {} } = this.state
    return (
      <form onSubmit={this.onSubmit}>
        <FormGroup
          controlId="formBasicText"
          validationState={validationState.status}
        >
          <ControlLabel>Enter View Name</ControlLabel>
          <FormControl
            type="text"
            autoComplete="off"
            value={this.state.text}
            placeholder="Add view and hit enter!"
            onChange={this.handleChange}
            onKeyPress={this.addView}
          />
          <div className="mt5">{validationState.text}</div>
        </FormGroup>
      </form>
    )
  }

  getPopover() {
    return (
      <Popover id="popover-views" className="view_dropdown">
        {this.getInput()}
        {this.getListItems()}
      </Popover>
    )
  }

  render() {
    const { allViews = {}, isChangingView = false } = this.state
    const { currentView = 'default' } = this.props
    const dropdown_text = allViews[currentView] ? allViews[currentView]['name'] : 'Select a view'
    return (
      <OverlayTrigger trigger="click" placement="bottom" overlay={this.getPopover()} rootClose>
        <Button id='show_view' className="ml15 mb10">
          <Glyphicon glyph="eye-open" />{' '}
          {isChangingView ? 'Changing view...' : dropdown_text }</Button>
      </OverlayTrigger>
    );
  }
}
