import {PropTypes} from 'prop-types';
import React from 'react';
import base from '../base';




class WebsiteCreator extends React.Component {


  constructor() {
    super();

    // get initial state
    this.state = {
      websites: {},
    };
  }

  componentWillMount() {
    this.ref = base.syncState(`${this.props.location.pathname}/website`, {
      context: this,
      state: `websites`
    });
  }


//  the constructo is one way to bind this, but we are doing it below --- <form className="website-creator" onSubmit={this.goToWebsite.bind(this)}>
//  constructor() {
//    super();
//    this.goToWebsite = this.goToWebsite.bind(this);
//  }
  goToWebsite(event) {
    //Keep from from submitting which is the default when a form is submitted
    event.preventDefault();
    console.log('you changed the URL');
    //first grab text from box and put it in a websiteI
    const websiteId = this.websiteInput.value;
    console.log(websiteId);

    //second we're going to transition from / to /website/:websiteId
    this.context.router.history.push(`/website/${websiteId}`);
  }


  render() {
    return (
      <div>
        <ul className="list-of-websites">
          <li><a href='/website/tourgigs/artists'>tourgigs</a></li>
          <li><a href='/website/pearljam/artists'>pearljam</a></li>
        </ul>

        <form className="website-creator" onSubmit={this.goToWebsite.bind(this)}>
          {/* Comment */}
          <h2>Please Enter a Website Name</h2>
          <input type="text" required placeholder="Website Name" ref={(input) => {this.websiteInput = input}}/>
          <button type="submit">Submit</button>
        </form>
      </div>
    )
  }
}

WebsiteCreator.contextTypes = {
  router: PropTypes.object
}

export default WebsiteCreator;
