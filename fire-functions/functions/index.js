const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '')           // Replace spaces
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.updateEventFilenames =  functions.database.ref('/contacts/{contactId}').onWrite((e) => {
  // Grab the current value of what was written to the Realtime Database.
  const original = e.data.val();
  const contact_id = e.params.contactId;
  const events_ref = e.data.ref.parent.parent.child('events')
  return events_ref.once('value')
    .then(events => {
      Object.keys(events.val()).map((key) => {
        events_ref.child(key).once('value').then((snapshot) => {
          const pre_event = snapshot.val()
          if (pre_event['contact'] == contact_id) {
            const new_event = Object.assign({}, pre_event, {
              filename: slugify(pre_event['date']) + '_' + slugify(original['name'])
            })
            events_ref.child(key).set(new_event)
          }
        })
      })
      return Promise.resolve()
    });
});

exports.updateTrackFilenamesOnSongUpdate =  functions.database.ref('/songs/{songId}').onWrite((e) => {
  // Grab the current value of what was written to the Realtime Database.
  const original = e.data.val();
  const song_id = e.params.songId;
  const tracks_ref = e.data.ref.parent.parent.child('tracks')
  const events_ref = e.data.ref.parent.parent.child('events')

  return tracks_ref.once('value')
    .then(tracks => {
      try {
        Object.keys(tracks.val()).map((key) => {
          tracks_ref.child(key).once('value').then((snapshot) => {
            const pre_track = snapshot.val();
            if (pre_track['song'] == song_id) {
              events_ref.child(pre_track['event']).once('value').then((event_snapshot) => {
                const event_obj = event_snapshot.val();
                const event_slug = event_obj['filename'];
                const song_slug = original['filename'];
                const new_track = Object.assign({}, pre_track, {
                  filename: event_slug + '_' + slugify(pre_track['order']) + '_' + song_slug
                })
                tracks_ref.child(key).set(new_track)
              })
            }
          })
        })
      } catch (e) {
        console.log('Error occured in updating song track ' + e)
      }
      return Promise.resolve()
    });
});


exports.updateTrackFilenamesOnEventUpdate =  functions.database.ref('/events/{eventId}').onWrite((e) => {
  // Grab the current value of what was written to the Realtime Database.
  const original = e.data.val();
  const event_id = e.params.eventId;
  const tracks_ref = e.data.ref.parent.parent.child('tracks')
  const songs_ref = e.data.ref.parent.parent.child('songs')

  return tracks_ref.once('value')
    .then(tracks => {
      try {
        Object.keys(tracks.val()).map((key) => {
          tracks_ref.child(key).once('value').then((snapshot) => {
            const pre_track = snapshot.val();
            if (pre_track['event'] == event_id) {
              songs_ref.child(pre_track['song']).once('value').then((song_snapshot) => {
                const song_obj = song_snapshot.val();
                const song_slug = song_obj['filename'];
                const event_slug = original['filename'];
                const new_track = Object.assign({}, pre_track, {
                  filename: event_slug + '_' + slugify(pre_track['order']) + '_' + song_slug
                })
                tracks_ref.child(key).set(new_track)
              })
            }
          })
        })
      } catch (e) {
        console.log('Error occured in updating event track ' + e)
      }
      return Promise.resolve()
    });
});
