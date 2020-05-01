//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the samplebot bot.

// Import Botkit's core features
const { Botkit } = require('botkit');
const { BotkitCMSHelper } = require('botkit-plugin-cms');

const { BotkitConversation} = require('botkit');

// Import a platform-specific adapter for web.

const { WebAdapter } = require('botbuilder-adapter-web');

const { MongoDbStorage } = require('botbuilder-storage-mongodb');

const YoutubeHelper  = require("./youtubeutil.js");

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
    });
}


const adapter = new WebAdapter({});


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



controller.hears('.*','message', async(bot, message) => {

    //await bot.reply(message, 'Hello Human : ' + message.text);
    
    await bot.beginDialog(DIALOG_ID);

});

//adding code for conversation support

let DIALOG_ID = 'my_dialog_1';
let myDialog = new BotkitConversation(DIALOG_ID,controller);

myDialog.say('Hello');
myDialog.ask('What is your name?', async(answer) => { 
    // do nothing.
}, {key: 'name'});

// collect a value with conditional actions
myDialog.ask('Do you hear Music?', [
    {
        pattern: 'yes',
        handler: function(response, convo,bot) {
            askMusicPreferences(response,convo,bot);
        }
    },
    {
        pattern: 'no',
        handler: async function(response, convo, bot) {
            await convo.gotoThread('hates_life');
        }
    }
],{key: 'response'});

//define the conversation


// define a 'likes_tacos' thread
myDialog.addMessage('Then make a biriyani for Saurav', 'likes_tacos');

// define a 'hates_life' thread
myDialog.addMessage('Music is a soul of life', 'hates_life');


// handle the end of the conversation
myDialog.after(async(results, bot) => {
    const name = results.name;
});

//add a dialog to the controller
controller.addDialog(myDialog);


function askMusicPreferences(answer, convo, bot){


myDialog.ask('What would like to hear?', [
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

module.exports = myDialog;
//exports.botkit = myDialog;








