var env = require('node-env-file');
env(__dirname + '/.env');

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');

const FORTUNE_COOKIES = require('./components/fortune_cookies');

var bot_options = {
    replyWithTyping: true,
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
    // create a custom db access method
    var db = require(__dirname + '/components/database.js')({});
    bot_options.storage = db;
} else {
    bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format
}

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.socketbot(bot_options);

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);

// Load in a plugin that defines the bot's identity
require(__dirname + '/components/plugin_identity.js')(controller);

// Open the web socket server
controller.openSocketServer(controller.httpserver);

// Start the bot brain in motion!!
controller.startTicking();

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function (file) {
    if (file === 'unused') { return; }
    require("./skills/" + file)(controller);
});

console.log('I AM ONLINE! COME TALK TO ME: http://localhost:' + (process.env.PORT || 3000));

controller.on('message_received', function (bot, message) {
    let answer = FORTUNE_COOKIES[
        Math.round(
            Math.random() * (FORTUNE_COOKIES.length - 1)
        )
    ];
    bot.reply(message,
        {
            text: answer,
            typingDelay: 500,
        }
    );
});
