const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Ensure that VERIFY_TOKEN and PAGE_ACCESS_TOKEN are correctly loaded
console.log('VERIFY_TOKEN:', VERIFY_TOKEN);
console.log('PAGE_ACCESS_TOKEN:', PAGE_ACCESS_TOKEN);

// CORS setup
app.use(cors());

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Variables to store the initial parameters
let storedMode, storedToken, storedChallenge;

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'] || storedMode;
    const token = req.query['hub.verify_token'] || storedToken;
    const challenge = req.query['hub.challenge'] || storedChallenge;

    console.log('Received GET /webhook request');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Mode:', mode);
    console.log('Token:', token);
    console.log('Challenge:', challenge);

    // Store the parameters if they are present
    if (req.query['hub.mode'] && req.query['hub.verify_token'] && req.query['hub.challenge']) {
        storedMode = req.query['hub.mode'];
        storedToken = req.query['hub.verify_token'];
        storedChallenge = req.query['hub.challenge'];
    }

    if (mode && token && challenge) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.error('Verification token mismatch');
            res.sendStatus(403);
        }
    } else {
        console.error('Missing query parameters');
        res.sendStatus(400);
    }
});

// Webhook event handling endpoint
app.post('/webhook', (req, res) => {
    console.log('Received POST /webhook request');
    const body = req.body;

    // Log the entire body to understand its structure
    console.log('Webhook request body:', JSON.stringify(body, null, 2));

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            // Log the entry object for debugging
            console.log('Entry:', JSON.stringify(entry, null, 2));

            const webhook_event = entry.messaging[0];
            console.log('Received webhook event:', JSON.stringify(webhook_event, null, 2));

            const sender_psid = webhook_event.sender.id;
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        console.error('Invalid object type:', body.object);
        res.sendStatus(404);
    }
});

// Handle incoming messages
function handleMessage(sender_psid, received_message) {
    console.log('Handling message from PSID:', sender_psid);
    console.log('Received message:', JSON.stringify(received_message, null, 2));

    let response;

    if (received_message.text) {
        response = {
            'text': `You sent the message: "${received_message.text}". Now send me an image!`
        };
    } else if (received_message.attachments) {
        response = {
            'text': 'Sorry, I can only process text messages for now.'
        };
    }

    callSendAPI(sender_psid, response);
}

// Handle postbacks
function handlePostback(sender_psid, received_postback) {
    console.log('Handling postback from PSID:', sender_psid);
    console.log('Received postback:', JSON.stringify(received_postback, null, 2));

    let response;

    const payload = received_postback.payload;

    if (payload === 'yes') {
        response = { 'text': 'Thanks!' };
    } else if (payload === 'no') {
        response = { 'text': 'Oops, try sending another message.' };
    }

    callSendAPI(sender_psid, response);
}

// Send message via Facebook Graph API
function callSendAPI(sender_psid, response) {
    const request_body = {
        'recipient': {
            'id': sender_psid
        },
        'message': response
    };

    console.log('Sending response via Graph API:', JSON.stringify(request_body, null, 2));

    request({
        uri: 'https://graph.facebook.com/v20.0/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: request_body
    }, (err, response, body) => {
        if (!err && response.statusCode === 200) {
            console.log('Message sent successfully!');
        } else {
            console.error('Unable to send message:', err || body.error);
        }
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
