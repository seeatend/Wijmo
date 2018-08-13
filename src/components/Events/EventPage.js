import React from 'react';
import firebase from '../../helpers/base';
import Header from './../common/Header';


class EventPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      events: {},
      contacts: {},
      venues: {}
    }
    this.getContactData = this.getContactData.bind(this);
    this.getVenueData = this.getVenueData.bind(this);
    this.getTracksForCurrentEvent = this.getTracksForCurrentEvent.bind(this);
    this.renderTracks = this.renderTracks.bind(this);
    this.setupDropdowns = this.setupDropdowns.bind(this)
  }

  setupDropdowns(dropdown_keys = []) {
    dropdown_keys.forEach((keyname) => {
      this.store_contacts_ref = firebase.ref().child(keyname);
      this.store_contacts_ref.on('value', (snapshot) => {
        const events_obj = snapshot.val();
        this.setState({
          [keyname]: events_obj
        })
      })
    })
  }

  componentDidMount() {
    this.setupDropdowns(['events', 'contacts', 'venues', 'tracks', 'songs'])
  }

  getContactData(contact_id) {
    let contact = {};
    const {contacts = {}}= this.state;

    Object.keys(contacts).map(art_id => {
      if (art_id == contact_id) {
        contact = contacts[contact_id]
      }
    })

    return contact;
  }
getVenueData(venue_id) {
    let venue = {};
    const { venues = {}} = this.state;
    Object.keys(venues).map(ven_id => {
      if (ven_id == venue_id) {
        venue = venues[venue_id]
      }
    })
    return venue;
  }

  getTracksForCurrentEvent(event_id) {
    const {tracks = {}} = this.state;
    let all_tracks = [];
    Object.values(tracks).map((track) => {
        if (track['event']== event_id) {
          all_tracks.push(track);
        }
    })
    return all_tracks;
  }

  renderTracks(all_tracks) {
    const {songs} = this.state;
    if (songs && Object.keys(songs).length) {
      return (
        <div>
          <h2>All Tracks</h2>
            <ul className="list-group">
            {
              all_tracks.map((track, index) => {
                const song_name = songs[track['song']]['name'];
                return <li className="list-group-item" key={index}>{track['set']}...{track['order']}...{song_name}</li>
              })
            }
            </ul>
        </div>
      );
    }
  }

render() {
  const event_id = this.props.match.params.eventId;

  console.log (this.state)

  const events = this.state.events;

  let required_event = events[event_id];

  if (required_event) {
    const { filename ='', date = '', name = '', type = '', contact = '', venue = '' } = required_event;
    const contact_data = this.getContactData(contact);
    const venue_data = this.getVenueData(venue);
    const all_tracks = this.getTracksForCurrentEvent(event_id);

    return (
      <div className="tourevents">
          <div className="header">
              <Header />
          </div>
          <div>
              <h1>Event Page</h1>
              <div style={{margin: 'auto', background: '#e7e7e7', width: '600px', padding: '10px'}}>
                <div class="panel panel-default">
                  <h3>Filename</h3>
                  <h4>{required_event['filename']}</h4>
                </div>
                <div class="panel panel-default">
                  <h3>Date</h3>
                  <h4>{required_event['date']}</h4>
                </div>
                <div class="panel panel-default">
                  <h3>Type</h3>
                  <h4>{required_event['type']}</h4>
                </div>
                <div class="panel panel-default">
                  <h3>ContactID</h3>
                  <h4>{required_event['contact']}</h4>
                </div>
                <div class="panel panel-default">
                  <h3>ContactName</h3>
                  <h4>{contact_data.name}</h4>
                </div>
                <div class="panel panel-default">
                  <h3>Venue</h3>
                  <h4>{venue_data.name}</h4>
                </div>
              {this.renderTracks(all_tracks)}
              </div>
          </div>
      </div>
    );
  }
  return <div className="text-center mt10">Loading...</div>;
  }
};

export default EventPage;
