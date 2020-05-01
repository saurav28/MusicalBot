/**
 * Lists the names and IDs of up to 10 files.
 *
 * 
 */

var {google} = require('googleapis');

var {myDialog} = require("./bot")

const getChannelPromise = new Promise((resolve,reject) => {

});


const getChannel = function getChannel(searchTerm) {
    return new Promise(function(resolve,reject) {
   
    var service = google.youtube({
      version : 'v3',
      auth : 'AIzaSyDT74RiKaJxxHAVyRjsSxcdXDTdhWkcS4w'});
  
    
    service.search.list({
      part: 'id,snippet',
      q: searchTerm
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        reject(err);
        return;
      }
      var channels = response.data.items;
      if (channels.length == 0) {
        console.log('No items found.');
      } else {
        console.log('This items\'s ID is %s. Its title is \'%s\', and ' ,
                    channels[0].id,
                    channels[0].snippet.title
                    );
      }
      console.log(channels.length);
      resolve(channels);
    });
    //
  }); 
    
  }

  module.exports ={
    getChannel
}