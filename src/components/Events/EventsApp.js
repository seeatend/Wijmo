import React from 'react';
import Header from './../common/Header';
import firebase from '../../helpers/base';
import { FilterPanel } from './../common/FilterPanel';
import mongoObjectId from '../../helpers/mongoId';
import ViewsDropdown from './../common/ViewsDropdown'
import { slugify } from '../../helpers';
import * as wjGrid from 'wijmo/wijmo.react.grid';
import { GroupPanel } from 'wijmo/wijmo.react.grid.grouppanel';
import { FlexGridFilter } from 'wijmo/wijmo.grid.filter'
import { ListBox } from 'wijmo/wijmo.input'
import { DataMap } from 'wijmo/wijmo.grid'
import { CollectionView, Control, hidePopup, hasClass, showPopup, format, PropertyGroupDescription, SortDescription } from 'wijmo/wijmo'

const TABLE_KEY = 'events'

const getCurrentViewKey = () => {
  return 'state_' + TABLE_KEY
}

const getCurrentView = () => {
  const view = window.localStorage.getItem(getCurrentViewKey())
  if (!view) {
    window.localStorage.setItem(getCurrentViewKey(), 'default')
  }
  return view ? view : 'default'
}

export default class Panel extends React.Component {

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this)
    this.onInitialized = this.onInitialized.bind(this)
    this.onCellEditEnded = this.onCellEditEnded.bind(this)
    this.deleteSelected = this.deleteSelected.bind(this)
    this.setupDropdowns = this.setupDropdowns.bind(this)
    this.deselectEverything = this.deselectEverything.bind(this)
    this.getUpdatedItem = this.getUpdatedItem.bind(this)
    this.onClickAddRow = this.onClickAddRow.bind(this)
    this.isLongList = this.isLongList.bind(this)
    this.updatedView = this.updatedView.bind(this)
    this.saveItem = this.saveItem.bind(this)
    this.saveState = this.saveState.bind(this)
    this.getTableState = this.getTableState.bind(this)
    this.retrieveState = this.retrieveState.bind(this)
    this.applySortDescriptions = this.applySortDescriptions.bind(this)
    this.applyGroupDescriptions = this.applyGroupDescriptions.bind(this)
    this.applyColumnLayout = this.applyColumnLayout.bind(this)
    this.setupDatamap = this.setupDatamap.bind(this)
    this.setupTableStateListener = this.setupTableStateListener.bind(this)
    this.saveStatePromise = this.saveStatePromise.bind(this)
    this.deleteView = this.deleteView.bind(this)
    this.setCurrentViewId = this.setCurrentViewId.bind(this)
    this.getViewsDropdown = this.getViewsDropdown.bind(this)

    // get initial state
    this.initialised = false
    this.state = {
      [TABLE_KEY]: [],
      view: null,
      currentView: getCurrentView(),
      contacts_dropdown: null,
      venues_dropdown: null,
      new_mongid: mongoObjectId(),
    };
  }

  getProcessedEvents(events_obj) {
    return Object.keys(events_obj).map((key) => {
      return {
        id: key,
        sel_for_deletion: false,
        ...events_obj[key],
      }
    })
  }

  getProcessedDropDownItem(item_list) {
    return Object.keys(item_list).map((id) => {
      const { name = '' } = item_list[id]
      return {
        key: id,
        name
      }
    })
  }

  setupDatamap() {
    const { flex, view } = this.state
    if (flex) {
      ['contact', 'venue'].map((keyname) => {
        const state_key = keyname + 's_dropdown'
        const dropdown_items = this.state[state_key] ? this.state[state_key] : []
        const columns = flex.columns;
        columns.forEach((column) => {
          const binding = column._binding._key
          if (binding == keyname) {
            column.dataMap = new DataMap(dropdown_items, 'key', 'name')
          } else if (binding == 'type') {
            column.dataMap = new DataMap(this.getEventTypes(), 'key', 'name')
          }
        })
      })
      if (view) {
        view.refresh()
      }
    }
  }

  setupDropdowns(dropdown_keys = []) {
    dropdown_keys.forEach((keyname) => {
      this.store_ref = firebase.ref().child(keyname + 's'); // Root keys are plural, eg : songs, events
      this.store_ref.on('value', (snapshot) => {
        const response_obj = snapshot.val();
        const dropdown_items = this.getProcessedDropDownItem(response_obj, keyname);
        this.setState({
          [keyname + 's']: response_obj,
          [keyname + 's_dropdown']: dropdown_items
        }, () => {
          this.setupDatamap()
        })
      })
    })
  }

  getTableState() {
    const { flex, filter } = this.state
    if (flex && filter) {
      const { columnLayout = {}, collectionView = {} } = this.state.flex
      const { filterDefinition = {} } = this.state.filter
      const { sortDescriptions = {} } = collectionView
      const { groupDescriptions = {} } = this.getGroupDescriptions()
      return {
        columnLayout,
        filterDefinition,
        sortDescriptions,
        groupDescriptions,
      }
    }
    return null
  }


  // Gets group and sort description
  getGroupDescriptions(keys) {
    const descriptions = {}
    const { view } = this.state;
    if (view) {
      const key = 'group'
      let desc = [];
      const description = view[key + 'Descriptions'] ? view[key + 'Descriptions'] : {}
      for (let group in description) {
        if (description[group].propertyName)
        desc.push(description[group].propertyName);
      }
      descriptions[key + 'Descriptions'] = desc
    }
    return descriptions
  }

  saveStatePromise() {
    const table_state = this.getTableState()
    const { currentView = '' } = this.state
    if (currentView) {
      const updates = {}
      updates[`/views/${TABLE_KEY}/allViews/${currentView}/state` ] = JSON.stringify(table_state)
      return firebase.ref().update(updates).then(() => Promise.resolve(table_state))
    }
    return Promise.resolve()
  }

  saveState() {
    this.saveStatePromise()
  }

  retrieveState() {
    const { viewState = '' } = this.state
    // const viewState = localStorage.getItem(CONFIG.getCurrentViewKey())
    if (viewState) {
      let table_state = JSON.parse(viewState)
      table_state = table_state ? table_state : {}
      const { columnLayout, filterDefinition, sortDescriptions, groupDescriptions } = table_state
      this.applyColumnLayout(columnLayout)
      this.applyFilters(filterDefinition)
      this.applySortDescriptions(sortDescriptions)
      this.applyGroupDescriptions(groupDescriptions)
      this.setupDatamap()
    }
  }

  applyColumnLayout(columnLayout) {
    const { flex } = this.state
    if (columnLayout && flex) {
      this.state.flex.columnLayout = columnLayout
    }
  }

  applyFilters(filters) {
    const { filter } = this.state
    if (filters && filter) {
      this.state.filter.filterDefinition = filters
    }
  }

  applySortDescriptions(loadedSort) {
    const { view, flex } = this.state
    if (loadedSort && view && flex) {
      flex.collectionView.sortDescriptions.clear();
      for (let i = 0; i < loadedSort.length; i++) {
        let sortDesc = loadedSort[i];
        flex.collectionView.sortDescriptions.push(
          new SortDescription(sortDesc._bnd._key, sortDesc._asc)
        );
      }
    }
  }

  applyGroupDescriptions(loadedGroups) {
    const { view, flex } = this.state
    if (loadedGroups && view && flex) {
      this.state.view.groupDescriptions.clear();
      for (var i = 0; i < loadedGroups.length; i++) {
        this.state.view.groupDescriptions.push(new PropertyGroupDescription(loadedGroups[i]));
      }
      this.state.flex.refresh();
    }
  }

  deselectEverything() {
    if (this.state.view.moveCurrentToPosition) {
      this.state.view.moveCurrentToPosition(-1)
    }
  }

  onScroll(event) {
    const top = this.scrollY;
    localStorage.setItem('pos', top);
  }

  setCurrentViewId(currentView) {
    const {allViews = {}} =  this.state
    window.localStorage.setItem(getCurrentViewKey(), currentView)
    this.setState({
      currentView,
      viewState: allViews[currentView]['state']
    }, () => {
      this.retrieveState()
    })
  }

  setupTableStateListener() {
    this.views_ref = firebase.ref().child('views').child(TABLE_KEY);
    this.views_ref.on('value', (snapshot) => {
      const views_data = snapshot.val();
      const { allViews = {} } = views_data ? views_data : {}
      let { currentView } = this.state
      this.setState({
        allViews
      }, () => {
        this.setCurrentViewId(currentView)
      })
    })

    if ('onbeforeunload' in window) {
      window.onbeforeunload = this.saveState
    }
  }

  componentWillUnmount() {
    localStorage.setItem('pos', 0);
    this.saveState()
    window.onbeforeunload = null
    window.onscroll = null
  }

  // connect GroupPanel to FlexGrid when the component mounts
  componentDidMount() {
    this.store_ref = firebase.ref().child(TABLE_KEY);
    this.store_ref.on('value', (snapshot) => {
      const events_obj = snapshot.val();
      const events_list = this.getProcessedEvents(events_obj);
      const view = new CollectionView(events_list);
      view.trackChanges = true;
      this.setState({
        view
      }, () => {
        this.deselectEverything()
      })
    })
    this.setupDatamap()
    this.setupTableStateListener()
    window.addEventListener("scroll", this.onScroll, false);
  }

  componentDidUpdate(prevProps, prevState) {
    this.retrieveState()
  }

  getEventTypes() {
    return [
      {
        name : 'Concert',
        key: 'concert'
      },
      {
        name : 'Conference',
        key: 'conference'
      },
      {
        name : 'Corporate',
        key: 'corporate'
      },
      {
        name : 'Product Launch',
        key: 'product_launch'
      },
    ]
  }

  deselectEverything() {
    if (this.state.view.moveCurrentToPosition) {
      this.state.view.moveCurrentToPosition(-1)
    }
  }

  onChange(s, e) {
    const items = this.state.view.itemsAdded
    let p = Promise.resolve()
    for (let i = 0; i < items.length; i++) {
      items[i].id = 'event-'+mongoObjectId()
      p = p.then(this.saveItem(items[i]))
    }
  }

  onInitialized(s, e) {
    const filter = new FlexGridFilter(s); // add a FlexGridFilter to it
    const filter_panel = new FilterPanel('#filterPanel', {
        filter: filter,
        placeholder: 'Active Filters'
    });

    const theColumnPicker = new ListBox('#theColumnPicker', {
      itemsSource: s.columns,
      checkedMemberPath: 'visible',
      displayMemberPath: 'header',
      lostFocus: () => {
        hidePopup(theColumnPicker.hostElement);
      }
    })

    let ref = document.getElementsByClassName('wj-topleft')[0];
    ref.addEventListener('mousedown', function (e) {
      if (hasClass(e.target, 'column-picker-icon')) {
        showPopup(theColumnPicker.hostElement, ref, false, true, false);
        theColumnPicker.focus();
        e.preventDefault();
      }
    });
    this.setState({
      flex: s,
      filter: filter
    }, () => {
      this.setupDropdowns(['contact', 'venue'])
    })
    return filter_panel
  }

  getUpdatedItem(item) {
    const { contacts = {} } = this.state;
    const deep_item = {...item}
    delete deep_item['id']
    const date = deep_item['date'] ? deep_item['date'] : ''
    const contact_filename = contacts[deep_item['contact']] ? contacts[deep_item['contact']]['filename'] : ''
    deep_item['filename'] = slugify(date) + '_' + contact_filename
    return deep_item
  }

  isRowEmpty(event = {}) {
    event = {...event}
    delete event['sel_for_deletion']
    return !Object.keys(event).length
  }

  saveItem(item = {}) {
    if (!this.isRowEmpty(item)) {
      let item_id = item['id'];
      if (!item_id) {
        item_id = 'events-'+mongoObjectId()
      }
      const updates = {};
      const updated_item = this.getUpdatedItem(item);
      updates[`/${TABLE_KEY}/` + item_id ] = updated_item;
      return firebase.ref().update(updates)
    }
    return Promise.resolve()
  }

  onCellEditEnded(s, e) {
    const { row, col } = e;
    let item = {...s.rows[row].dataItem};
    this.saveItem(item)
  }

  deleteRows(rows = []) {
    const updates = {}
    const ids = rows.map(event => {
      updates[`/${TABLE_KEY}/` + event['id']] = null
    })
    firebase.ref().update(updates);
  }

  deleteSelected() {
    const selected_rows = this.state.view.items.filter(event => event['sel_for_deletion'])
    this.deleteRows(selected_rows)
  }

  setupGrouping() {
    const grouping_successful = false
    let interval = null
    const mapGrouping = () => {
      try {
        const grid = Control.getControl(document.getElementById('theGrid'));
        const panel = Control.getControl(document.getElementById('thePanel'));
        panel.hideGroupedColumns = false;
        panel.grid = grid;
      } catch (e) {
        setTimeout(mapGrouping, 1000)
      }
    }
    setTimeout(mapGrouping, 1000)
  }

  onClickAddRow() {
    this.bottom.scrollIntoView()
  }

  gotoTop() {
    window.scrollTo(0,0);
  }

  isLongList() {
    const { view } = this.state;
    if (view && view.items) {
      return view.items.length > 30
    }
    return false
  }

  updatedView(s, e) {
    let nPos = localStorage.getItem("pos");
    this.setupGrouping()
    if (nPos) {
      window.scrollTo(0, nPos);
    }
  }

  formatItem(s, e) {
    const flex = s;
    if (e.panel == flex.topLeftCells) {
      e.cell.innerHTML = '<span class="column-picker-icon glyphicon glyphicon-cog"></span>';
    }
    if (e.panel == flex.cells && flex.columns[e.col].binding == 'link' && flex.rows[e.row].dataItem && flex.rows[e.row].dataItem.id) {
      e.cell.innerHTML = format('<div class="text-center"><a href="/event/{id}" target="_blank"> Link &rarr; </a></div>', flex.rows[e.row].dataItem);
    }
  }

  getLoader() {
    return (
      <div className="text-center">
        Crunching the latest data...
      </div>
    )
  }

  getGrids() {
    const { contacts_dropdown, venues_dropdown } = this.state;
    return (
      <div >
        <GroupPanel
          id="thePanel"
          placeholder="Drag columns here to create Groups"
          className="clearfix mb10 text-center br-4"/>
        <wjGrid.FlexGrid
          id ='theGrid'
          autoGenerateColumns={false}
          columns={[
            { header: 'ID', binding: 'id', width: '1.3*', minWidth: 250, isReadOnly: true },
            { header: 'Type', binding: 'type', dataMap: new DataMap(this.getEventTypes(), 'key', 'name'), width: '1.2*', minWidth: 150,isRequired: true },
            { header: 'Contact', binding: 'contact', width: '1.2*', minWidth: 200, isRequired: true },
            { header: 'Venue', binding: 'venue', width: '1.2*', minWidth: 200, isRequired: true },
            { header: 'Venue City', binding: 'venueCity', width: '1*', minWidth: 200 },

            { header: 'Date', binding: 'date', width: '1*', minWidth: 100 },
            { header: 'Filename', binding: 'filename', width: '1*', minWidth: 250, isReadOnly: true},
            { header: 'Link', binding: 'link', width: '1*', minWidth: 100, isReadOnly: true},
            { header: 'Delete', binding: 'sel_for_deletion', width: '.5*' , minWidth: 80},
          ]}
          cellEditEnded={this.onCellEditEnded}
          cellEditEnding={this.saveState}
          onRefreshed={this.saveState}
          itemsSource={this.state.view}
          initialized={ this.onInitialized }
          allowAddNew={true}
          updatedView={this.updatedView}
          formatItem={this.formatItem}
          onPasted={this.onChange}
        />
      </div>
    )
  }

  getViewsDropdown() {
    const { currentView = 'default' } = this.state
    return (
      <ViewsDropdown
        table={TABLE_KEY}
        saveState={this.saveStatePromise}
        setCurrentViewId={this.setCurrentViewId}
        currentView={currentView}
      />
    )
  }

  deleteView() {
    const { currentView = '' } = this.state
    if (currentView != 'default') {
      const updates = {}
      updates[`/views/${TABLE_KEY}/allViews/${currentView}` ] = null
      this.setCurrentViewId('default')
      return firebase.ref().update(updates)
    }
  }

  render() {
    const { currentView = '' } = this.state
    const show_delete_view = currentView !== 'default';
    const is_long_list = this.isLongList()
    return (
      <div>
        <Header tab={TABLE_KEY}/>
        {this.getViewsDropdown()}
        <span className='table_header'>Events</span>
        <button className='pull-right btn btn-default mb10 mr15' onClick={this.deleteSelected}> Delete Selected </button>
        { show_delete_view && <button className='pull-right btn btn-default mb10 mr10' onClick={this.deleteView}> Delete View </button>}
        { is_long_list && <button className='pull-right btn btn-default mb10 mr10' onClick={this.onClickAddRow}> Add Row </button>}
        <div id="filterPanel"></div>
        <div style={{display : 'none'}}>
          <div id="theColumnPicker" className="column-picker"></div>
        </div>
        {this.getGrids()}
        { is_long_list && <button ref={(el) => { this.bottom = el }} className='pull-right btn btn-default mt10 bottom-button mr15' onClick={this.deleteSelected}> Delete Selected </button>}
        { is_long_list && <button onClick={this.gotoTop} className='pull-right btn btn-default mt10 bottom-button mr10'> Go to top </button>}
      </div>
    )
  }
}
