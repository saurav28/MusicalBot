//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the facebookbot bot.

// Import Botkit's core features
const { Botkit } = require('botkit');
const { BotkitCMSHelper } = require('botkit-plugin-cms');

const { FacebookBotWorker } = require('botbuilder-adapter-facebook');

const { BotkitConversation} = require('botkit');

// Import a platform-specific adapter for facebook.

const { FacebookAdapter, FacebookEventTypeMiddleware } = require('botbuilder-adapter-facebook');

const { MongoDbStorage } = require('botbuilder-storage-mongodb');

// Load process.env values from .env file
require('dotenv').config();

let DIALOG_ID = 'my_dialog_1';

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
    });
}


const adapter = new FacebookAdapter({

    // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
    enable_incomplete: true,

    verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
    access_token: process.env.FACEBOOK_ACCESS_TOKEN,
    app_secret: process.env.FACEBOOK_APP_SECRET,
})

// emit events based on the type of facebook event being received
adapter.use(new FacebookEventTypeMiddleware());


const controller = new Botkit({
    webhook_uri: '/api/messages',

    adapter: adapter,

    storage
});

if (process.env.CMS_URI) {
    controller.usePlugin(new BotkitCMSHelper({
        uri: process.env.CMS_URI,
        token: process.env.CMS_TOKEN,
    }));
}

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

    /* catch-all that uses the CMS to trigger dialogs */
    if (controller.plugins.cms) {
        controller.on('message,direct_message', async (bot, message) => {
            let results = false;
            results = await controller.plugins.cms.testTrigger(bot, message);
             
            if (results !== false) {
                // do not continue middleware!
                return false;
            }
        });
    }

});



controller.webserver.get('/', (req, res) => {

    res.send(`This app is running Botkit ${ controller.version }.`);

});


controller.hears('hi','message', async(bot, message) => {

    
    console.log('I heard a message');
   
    //await bot.reply(message, 'Howdy Human');

  

//   await bot.reply(message, {
//     text: 'Choose a button', 
//     quick_replies: [
//         {
//             "content_type":"text",
//             "title":"Foo",
//             "payload":"true"
//         },
//         {
//             "content_type":"text",
//             "title":"Bar",
//             "payload":"false"
//         }
//     ]
// });
 
     
       await bot.beginDialog(DIALOG_ID);

    
    
});



// const myDialog = new BotkitConversation(DIALOG_ID, controller);
try {
let myDialog = new BotkitConversation(DIALOG_ID,controller);
//myDialog.say('Hello');

myDialog.ask('Do you hear Music?', [
    {
        pattern: 'yes',
        handler: async function(response, convo,bot) {
            await askMusicPreferences(response,convo,bot);
        }
    },
    {
        pattern: 'no',
        handler: async function(response, convo, bot) {
            await convo.gotoThread('hates_life');
        }
    }
],{key: 'response'});      
        
//add a dialog to the controller
controller.addDialog(myDialog);
}catch (err){
    console.log('error occurred' , err);
}


function askMusicPreference(answer, convo, bot){
    convo.ask('What would like to hear?', [
        {
            pattern: '.*',
            handler: async(response, convo, bot, message) => {
                try {
                var channels = await YoutubeHelper.getChannel(response);
                
                if (channels.length == 0) {
                    
                   await bot.say('No items found.');
                }
                   else {
                    for (i =0 ; i < channels.length ; i++) {
                    var videoLink = "Video link";
                    var videoURL = videoLink.link("https://www.youtube.com/watch?v="+channels[i].id.videoId);
                     
                    await bot.say(`This item is ${videoURL}. Its title is ${channels[i].snippet.title}`);
                    }
                  }
                
                }catch (error){
                    console.log( 'error occurred ', err);
                }
               
                 
          
           
        }
    }
    ],  {key: 'name'});
}

//module.exports = convo;
// generic code for facebook support ends here

//adding code for conversation support

