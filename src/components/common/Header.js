import React from 'react';
import { Link } from 'react-router-dom';
const Header = (props) => {
  const {tab = ''} = props;
  return (
    <header className="top">
      <nav className="navbar navbar-default">
        <div className="container-fluid">
          <div className="navbar-header">
            <a className="navbar-brand" href="#">Gijmo-Fire</a>
          </div>
          <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul className="nav navbar-nav ">
              <li className={tab == 'contacts' ? 'active' : '' }> <Link to={'/contacts'}>Contacts</Link></li>
              <li className={tab == 'events' ? 'active' : '' }> <Link to={'/events'}>Events</Link></li>
              <li className={tab == 'venues' ? 'active' : '' }> <Link to={'/venues'}>Venues</Link></li>
              <li className={tab == 'tracks' ? 'active' : '' }> <Link to={'/tracks'}>Tracks</Link></li>
              <li className={tab == 'songs' ? 'active' : '' }> <Link to={'/songs'}>Songs</Link></li>
              <li className={tab == 'projects' ? 'active' : '' }> <Link to={'/projects'}>Projects</Link></li>
              <li className={tab == 'websites' ? 'active' : '' }> <Link to={'/websites'}>Websites</Link></li>
              <li className={tab == 'webpages' ? 'active' : '' }> <Link to={'/webpages'}>Webpages</Link></li>

            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}
export default Header;
