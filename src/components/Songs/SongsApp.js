import React from 'react';
import Header from './../common/Header';
import { FilterPanel } from './../common/FilterPanel';
import firebase from '../../helpers/base';
import mongoObjectId from '../../helpers/mongoId';
import ViewsDropdown from './../common/ViewsDropdown'
import { slugify } from '../../helpers';
import * as wjGrid from 'wijmo/wijmo.react.grid';
import { GroupPanel } from 'wijmo/wijmo.react.grid.grouppanel';
import { FlexGridFilter } from 'wijmo/wijmo.grid.filter'
import { ListBox } from 'wijmo/wijmo.input'
import { DataMap } from 'wijmo/wijmo.grid'
import { CollectionView, Control, hidePopup, hasClass, showPopup, format, PropertyGroupDescription, SortDescription } from 'wijmo/wijmo'

const TABLE_KEY = 'songs'


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
    this.getSongsData = this.getSongsData.bind(this)
    this.onInitialized = this.onInitialized.bind(this)
    this.onCellEditEnded = this.onCellEditEnded.bind(this)
    this.deleteSelected = this.deleteSelected.bind(this)
    this.onClickAddRow = this.onClickAddRow.bind(this)
    this.isLongList = this.isLongList.bind(this)
    this.updatedView = this.updatedView.bind(this)
    this.saveItem = this.saveItem.bind(this)
    this.onChange = this.onChange.bind(this)
    this.saveState = this.saveState.bind(this)
    this.getTableState = this.getTableState.bind(this)
    this.retrieveState = this.retrieveState.bind(this)
    this.applySortDescriptions = this.applySortDescriptions.bind(this)
    this.applyGroupDescriptions = this.applyGroupDescriptions.bind(this)
    this.applyColumnLayout = this.applyColumnLayout.bind(this)
    this.getViewsDropdown = this.getViewsDropdown.bind(this)
    this.saveStatePromise = this.saveStatePromise.bind(this)
    this.deleteView = this.deleteView.bind(this)
    this.setCurrentViewId = this.setCurrentViewId.bind(this)
    // get initial state
    this.state = {
      [TABLE_KEY]: [],
      view: null,
      currentView: getCurrentView(),
    };
  }

  getProcessedSongs(songs_obj) {
    return Object.keys(songs_obj).map((key) => {
      return {
        id: key,
        sel_for_deletion: false,
        ...songs_obj[key],
      }
    })
  }

  isLongList() {
    if (this.state.view && this.state.view.items) {
      return this.state.view.items.length > 30
    }
    return false
  }

  onScroll(event) {
    const top = this.scrollY;
    localStorage.setItem('pos', top);
  }

  componentDidUpdate(prevProps, prevState) {
    const {view} = this.state
    this.retrieveState()
    if (view && view.moveCurrentToLast) {
      view.moveCurrentToLast()
    }
  }

  setCurrentViewId(currentView = 'default') {
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
    localStorage.setItem('pos', 2);
    this.saveState()
    window.onbeforeunload = null
    window.onscroll = null
  }
  // connect GroupPanel to FlexGrid when the component mounts
  componentDidMount() {
    this.store_ref = firebase.ref().child(TABLE_KEY);
    this.store_ref.on('value', (snapshot) => {
      const songs_obj = snapshot.val();
      const songs_list = this.getProcessedSongs(songs_obj);
      const view = new CollectionView(songs_list);
      view.trackChanges = true;
      this.setState({
        view
      })
    })
    this.setupTableStateListener()
    window.addEventListener("scroll", this.onScroll, false);
  }

  onChange(s, e) {
    const items = this.state.view.itemsAdded
    let p = Promise.resolve()
    for (let i = 0; i < items.length; i++) {
      items[i].id = 'song-'+mongoObjectId()
      p = p.then(this.saveItem(items[i]))
    }
  }

  getSongsData() {
    return Object.values(this.state.songs)
  }

  getSongTypes() {
    return [
      {
        name : 'Theatre',
        key: 'theatre'
      },
      {
        name : 'Stadium',
        key: 'stadium'
      },
      {
        name : 'Amphitheatre',
        key: 'amphitheatre'
      },
      {
        name : 'Store',
        key: 'store'
      }
    ]
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
    })
    return filter_panel
  }

  getTableState() {
    const { flex, filter } = this.state
    if (flex && filter) {
      const { columnLayout = {} } = this.state.flex
      const { filterDefinition = {} } = this.state.filter
      const { sortDescriptions = {} } = this.state.flex.collectionView
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

  getUpdatedItem(item) {
    const deep_item = {...item}
    delete deep_item['id']
    const filename = slugify(deep_item['name'] ? deep_item['name'] : '')
    deep_item['filename'] = filename;
    return deep_item
  }

  isRowEmpty(song = {}) {
    song = {...song}
    delete song['sel_for_deletion']
    return !Object.keys(song).length
  }

  saveItem(item = {}) {
    if (!this.isRowEmpty(item)) {
      let item_id = item['id'];
      if (!item_id) {
        item_id = 'song-'+mongoObjectId()
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
    const ids = rows.map(song => {
      updates[`/${TABLE_KEY}/` + song['id']] = null
    })
    firebase.ref().update(updates);
  }

  deleteSelected() {
    const selected_rows = this.state.view.items.filter(song => song['sel_for_deletion'])
    this.deleteRows(selected_rows)
  }

  onClickAddRow() {
    this.bottom.scrollIntoView()
  }

  gotoTop() {
    window.scrollTo(0,0);
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

  updatedView(s, e) {
    let nPos = localStorage.getItem("pos");
    this.setupGrouping()
    if (nPos) {
      window.scrollTo(0, nPos);
    }
  }

  formatItem(s, e) {
    if (e.panel == s.topLeftCells) {
      e.cell.innerHTML = '<span class="column-picker-icon glyphicon glyphicon-cog"></span>';
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
    const { view } = this.state;
    if (view == null) {
      return this.getLoader()
    }
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
              { header: 'ID', binding: 'id', width: '.7*', minWidth: 250, isReadOnly: true },
              { header: 'Name', binding: 'name', width: '1*', minWidth: 250, isRequired: true },
              { header: 'Filename', binding: 'filename', width: '1*', minWidth: 250, isReadOnly: true },
              { header: 'Delete', binding: 'sel_for_deletion', width: '.4*', minWidth: 80},
          ]}
          cellEditEnded={this.onCellEditEnded}
          cellEditEnding={this.saveState}
          onRefreshed={this.saveState}
          itemsSource={this.state.view}
          initialized={ this.onInitialized }
          allowAddNew={true}
          formatItem={this.formatItem}
          updatedView={this.updatedView}
          onPasted={this.onChange}
        />
      </div>
    )
  }

  getViewsDropdown() {
    const { currentView } = this.state
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
        <span className='table_header'>Songs</span>
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
