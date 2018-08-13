import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import ContactApp from './components/Contacts/ContactApp';
import EventsApp from './components/Events/EventsApp';
import EventPage from './components/Events/EventPage';
import VenuesApp from './components/Venues/VenuesApp';
import SongsApp from './components/Songs/SongsApp';
import TracksApp from './components/Tracks/TracksApp';
import ProjectsApp from './components/Projects/ProjectsApp';
import WebsitesApp from './components/Websites/WebsitesApp';
import WebpagesApp from './components/Webpages/WebpagesApp';


import NotFound from './components/NotFound';
import './styles/app.css'
import './styles/wijmo.min.css'


const Root = () => {
  return (
    <BrowserRouter>
      <div>
          <Switch>
            <Route exact path="/" component={ContactApp} />
            <Route exact path="/contacts"  component={ContactApp} />
            <Route path="/events"  component={EventsApp} />
            <Route exact path="/event/:eventId"  component={EventPage} />
            <Route exact path="/venues"  component={VenuesApp} />
            <Route exact path="/tracks"  component={TracksApp} />
            <Route exact path="/songs"  component={SongsApp} />
            <Route exact path="/projects"  component={ProjectsApp} />
            <Route exact path="/websites"  component={WebsitesApp} />
            <Route exact path="/webpages"  component={WebpagesApp} />
            <Route component={NotFound} />
          </Switch>
      </div>
    </BrowserRouter>
  )
}

render(<Root/>, document.getElementById('main'));
