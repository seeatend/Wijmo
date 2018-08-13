import React from 'react';
import Header from './../common/Header';
import firebase from '../../helpers/base';
import mongoObjectId from '../../helpers/mongoId';
import { slugify } from '../../helpers';
import * as wjGrid from 'wijmo/wijmo.react.grid';
import { GroupPanel } from 'wijmo/wijmo.react.grid.grouppanel';
import { FlexGridFilter } from 'wijmo/wijmo.grid.filter'
import { DataMap } from 'wijmo/wijmo.grid'
import { CollectionView, Control } from 'wijmo/wijmo'

export default class Panel extends React.Component {

  constructor(props) {
    super(props);
    this.getWebsitesData = this.getWebsitesData.bind(this)
    this.onInitialized = this.onInitialized.bind(this)
    this.onCellEditEnded = this.onCellEditEnded.bind(this)
    this.deleteSelected = this.deleteSelected.bind(this)
    this.deselectEverything = this.deselectEverything.bind(this)
    this.onClickAddRow = this.onClickAddRow.bind(this)
    // get initial state
    this.state = {
      websites: [],
      view: []
    };
  }

  getProcessedWebsites(websites_obj) {
    return Object.keys(websites_obj).map((key) => {
      return {
        id: key,
        sel_for_deletion: false,
        ...websites_obj[key],
      }
    })
  }

  deselectEverything() {
    // if (this.state.view.moveCurrentToPosition) {
    //   this.state.view.moveCurrentToPosition(-1)
    // }
  }
  // connect GroupPanel to FlexGrid when the component mounts
  componentDidMount() {
      this.store_ref = firebase.ref().child('websites');
      this.store_ref.on('value', (snapshot) => {
        const websites_obj = snapshot.val();
        const websites_list = this.getProcessedWebsites(websites_obj);
        const view = new CollectionView(websites_list);
        view.trackChanges = true;
        this.setState({
          view
        }, () => {
          this.deselectEverything()
        })
      })
      const grid = Control.getControl(document.getElementById('theGrid'));
      const panel = Control.getControl(document.getElementById('thePanel'));
      panel.grid = grid;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.view.moveCurrentToLast) {
      this.state.view.moveCurrentToLast()
    }
  }

  getWebsitesData() {
    return Object.values(this.state.websites)
  }



  onInitialized(s, e) {
    return new FlexGridFilter(s); // add a FlexGridFilter to it
  }

  getUpdatedItem(item) {
    const deep_item = {...item}
    delete deep_item['id']
    const filename = slugify(deep_item['name'] ? deep_item['name'] : '')
    deep_item['filename'] = filename;
    return deep_item
  }

  isRowEmpty(website = {}) {
    website = {...website}
    delete website['sel_for_deletion']
    return !Object.keys(website).length
  }

  onCellEditEnded(s, e) {
    const { row, col } = e;
    let item = {...s.rows[row].dataItem};
    if (!this.isRowEmpty(item)) {
      s.finishEditing()
      let item_id = item['id'];
      if (!item_id) {
        item_id = 'website-'+mongoObjectId()
      }
      const updates = {};
      const updated_item = this.getUpdatedItem(item);
      updates['/websites/' + item_id ] = updated_item;
      firebase.ref().update(updates);
    }

  }

  deleteRows(rows = []) {
    const updates = {}
    const ids = rows.map(website => {
      updates['/websites/'+website['id']] = null
    })
    firebase.ref().update(updates);
  }

  deleteSelected() {
    const selected_rows = this.state.view.items.filter(website => website['sel_for_deletion'])
    this.deleteRows(selected_rows)
  }
  onClickAddRow() {
    this.bottom.scrollIntoView()
  }
  gotoTop() {
    window.scrollTo(0,0);
  }
  render() {
    return (
      <div>
        <Header tab='websites'/>
        <div className='container'>
          <div className="row">
            <div className='col-md-12'>
              <span className='table_header'>Websites</span>
              <button className='pull-right btn btn-default mb10' onClick={this.deleteSelected}> Delete Selected </button>
              <button className='pull-right btn btn-default mb10 mr10' onClick={this.onClickAddRow}> Add Row </button>
              <GroupPanel
                id="thePanel"
                placeholder="Drag columns here to create Groups"
                className='clearfix mb10 text-center br-4'
              />

              <wjGrid.FlexGrid
                id ='theGrid'
                autoGenerateColumns={false}
                columns={[
                    { header: 'ID', binding: 'id', width: '1.3*', isReadOnly: true },
                    { header: 'Name', binding: 'name', width: '1*', isRequired: true },
                    { header: 'URL', binding: 'url', width: '1*', isRequired: true },
                    { header: 'Filename', binding: 'filename', width: '1*', isReadOnly: true },
                    { header: 'Delete', binding: 'sel_for_deletion', width: '.5*'},
                ]}
                cellEditEnded={this.onCellEditEnded}
                showDropDown={true}
                itemsSource={this.state.view}
                initialized={ this.onInitialized }
                allowAddNew={true}
              />
              <button ref={(el) => { this.bottom = el }} className='pull-right btn btn-default mt10 bottom-button' onClick={this.deleteSelected}> Delete Selected </button>
              <button onClick={this.gotoTop} className='pull-right btn btn-default mt10 bottom-button mr10'> Go to top </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
