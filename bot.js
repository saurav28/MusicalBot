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

const YoutubeHelper  = require("./youtubeutil.js");

var processed =true;

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


controller.hears('.*','message', async(bot, message) => {

    //var oldText = message.incoming_message.text;
    
    // if(!processed){
    //     return;
    // }
    processed = false;
    var nlpEntities = message.incoming_message.channelData.nlp.entities;
        
    if(checkSentimentValue(nlpEntities)|| message.incoming_message.text == '#music'){
    await bot.beginDialog(DIALOG_ID);
    }else if(nlpEntities.bye != null &&  nlpEntities.bye[0].confidence >0.8){
        processed = true;
        await bot.reply (message,'Do you want to leave ? i can suggest some nice music for you. Just enter \'#music\'');
    } else if(nlpEntities.thanks != null && nlpEntities.thanks[0].confidence >0.8){
        processed = true;
        await bot.reply (message,'Hope you liked our recommendations. If you want to keep hearing music just say \'#music\'');
    } else if (isSentimentNegative(nlpEntities)){
        await bot.reply (message,'You Don\'t seem to be in nice mood. Why Don\'t you cheer yourself up by listening to some music by entering \'#music\'');
    }
    else {
        processed = true;
        await bot.reply (message,'Welcome to your Musical assistant. Just start grooving by entering \'#music\'');
    }
 
    
});



// const myDialog = new BotkitConversation(DIALOG_ID, controller);

let myDialog = new BotkitConversation(DIALOG_ID,controller);
try {
myDialog.say('Hello. Lets start grooving');

myDialog.ask('Do you want to hear some music?', [
    {
        pattern: 'yes',
        handler: async function(response, convo,bot) {
            console.log("you like music");
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

myDialog.addMessage('Hope you liked our recommendations . If you would like keep hearing music then enter \'#music\'',
//     action: 'complete'
'End_of_conversation');

function askMusicPreferences(answer, convo, bot){
    console.log (' Inside asking for music preferences');
    myDialog.ask('What would you like to hear?', [
        {
            pattern: '.*',
            handler: async(response, convo, bot, message) => {
                try {
                var channels = await YoutubeHelper.getChannel(response);
                var noOfChannels = channels.length;
                console.log('No of videos:: ' + noOfChannels);
                if (noOfChannels == 0) {
                    
                   await bot.say('No items found.');
                }
                   else {
                     
                    for (i =0 ; i < noOfChannels ; i++) {
                    var videoLink = "Video link";
                   // var videoURL = videoLink.link("https://www.youtube.com/watch?v="+channels[i].id.videoId);
                     var videoURL = "https://www.youtube.com/watch?v="+channels[i].id.videoId;
                    //facebook template formed as per https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic
                            
                    await bot.say({
                        channelData:{ //need to send attachments with channeldata https://dev4slack.slack.com/archives/C0AV5N8NA/p1563790610005000
                        attachment:{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements":[
                                 {
                                  "title":"Youtube Video!",
                                  "image_url":"https://petersfancybrownhats.com/company_image.png",
                                  "subtitle":"Your choice of video",
                                  "default_action": {
                                    "type": "web_url",
                                    "url": videoURL,
                                    "webview_height_ratio": "tall",
                                  },
                                 
                                }
                              ]
                            }
                        }
                    }
                    });
                    }
                  }
                  processed = true;
                  convo.gotoThread('End_of_conversation');
                
                }catch (error){
                    console.log( 'error occurred ', error);
                }
               
                 
          
           
        }
    }
    ],  {key: 'name'});
}
//Interrupt to quit
controller.interrupts('quit', 'message', async(bot, message) => {
    await bot.reply(message, 'Quitting!');

    // cancel any active dialogs
    await bot.cancelAllDialogs();
});
function checkSentimentValue(nlpEntities){
    var result = false;
    
    if(nlpEntities.greetings != null && nlpEntities.sentiment != null) {
    var greetingsConfidence = nlpEntities.greetings[0].confidence;
    var sentimentValue = nlpEntities.sentiment[0].value;
    console.log('greetings confidence', greetingsConfidence);
    console.log('sentiment value', sentimentValue);
   if (greetingsConfidence > 0.8 && sentimentValue == 'positive'){
       result = true;
   }
}
   return result;
}

function isSentimentNegative(nlpEntities){
    var result = false;
    
    if(nlpEntities.sentiment != null) {
   
    var sentimentValue = nlpEntities.sentiment[0].value;
    
    console.log('sentiment value', sentimentValue);
   if (sentimentValue == 'negative'){
       result = true;
   }
}
   return result;
}

module.exports = myDialog;
// generic code for facebook support ends here

//adding code for conversation support

