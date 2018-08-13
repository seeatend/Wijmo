import Rebase from 're-base';
import firebase from 'firebase'

const config = {
  apiKey: "AIzaSyC6sIv1IsF8HJ4O3AkxU8qDyBHsRPOy9q0",
  authDomain: "gijmo-fire.firebaseapp.com",
  databaseURL: "https://gijmo-fire.firebaseio.com",
}

const app = firebase.initializeApp(config)
// const base = Rebase.createClass(app.database())
const database_ref = app.database();
export default database_ref;
