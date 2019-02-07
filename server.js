const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const server = app.listen(3000, () => {
	console.log('server is running on port', server.address().port);
});
const io = require('socket.io')(server);

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const dbUrl = 'mongodb://someone:someone@localhost:27017/simplechat'


mongoose.connect(dbUrl, (err) => {
	console.log('mongodb connected', err);
});

const Message = mongoose.model('Message', {name: String, message: String});

io.on('connection', (socket) => {
	const address = socket.handshake.address;
	console.log('new connection from ' + address);
});

app.get('/messages', (req, rsp) => {
	Message.find({}, (err, messages) => {
		rsp.send(messages);
	});
});

function embed_youtube(message) {
	pattern = message.match(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/i);
	if (pattern) {
		var url = pattern[0].replace('watch?v=', 'embed/');
		url = url.replace('&t=', '?start=');
		return message.concat('<br><iframe width="560" height="315" src="', url, '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
	}
	return message;
};

app.post('/messages', (req, rsp) => {
	const _name = req.body.name
	const _msg = embed_youtube(req.body.message);
	const data = {name: _name, message: _msg}
	const message = new Message(data);
	message.save((err) => {
		if (err) return sendStatus(500);
		io.emit('message', data);
		rsp.sendStatus(200);
	});
});
