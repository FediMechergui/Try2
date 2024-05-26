const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://try2-omega.vercel.app'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const corsOptions = {
    origin: 'https://try2-omega.vercel.app' 
};

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.options('*', cors());

app.get('/webhook', (req, res) => {
    console.log('Received webhook verification request:', req.query);

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Mode:', mode);
    console.log('Token:', token);
    console.log('Challenge:', challenge);

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.error('Verification token mismatch');
            res.sendStatus(403);
        }
    } else {
        console.error('Missing mode or token in request');
        res.sendStatus(400);
    }
});


app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            const webhook_event = entry.messaging[0];
            console.log('Received webhook event:', webhook_event);

            const sender_psid = webhook_event.sender.id;
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        console.error('Invalid object type');
        res.sendStatus(404);
    }
});

function handleMessage(sender_psid, received_message) {
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

function handlePostback(sender_psid, received_postback) {
    let response;

    const payload = received_postback.payload;

    if (payload === 'yes') {
        response = { 'text': 'Thanks!' };
    } else if (payload === 'no') {
        response = { 'text': 'Oops, try sending another message.' };
    }

    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
    const request_body = {
        'recipient': {
            'id': sender_psid
        },
        'message': response
    };

    request({
        uri: 'https://graph.facebook.com/v20.0/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('Message sent!');
        } else {
            console.error('Unable to send message:', err);
        }
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
