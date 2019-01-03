#!/usr/bin/env node

'use strict'

const express	=	require('express'),
	getPort		=	require('get-port'),
	fs			=	require('fs'),
	mime		=	require('mime'),
	http		=	require('http'),
	socketio	=	require('socket.io'),
	opn			=	require('opn')

const app		=	express()
const server	=	http.createServer(app)
const io		=	socketio(server)

io.on('connection', socket => {
	fs.watch(process.cwd(), { encoding: 'utf-8' }, (eventType, filename) => {
		if (filename && !socket.debounce) {
			socket.emit('reload')
		}
	})
})

app.get('/___ezreload_live_reload.js', (req, res) => {
	return res.status(200)
		.set('Content-type', 'application/javascript')
		.end(fs.readFileSync(__dirname + '/___ezreload_live_reload.js'))
})

app.get('*', (req, res) => {
	let targetFile = process.cwd() + req.url
	if (targetFile.endsWith('/')) {
		targetFile += 'index.html'
	}

	if (fs.existsSync(targetFile)) {
		let mimeType = mime.getType(targetFile)
		let fileContent = fs.readFileSync(targetFile)

		if (!mimeType) {
			mimeType = 'text/plain'
		}
		if (mimeType === 'text/html') {
			fileContent += '<script src=\'/___ezreload_live_reload.js\'></script>'
		}

		return res
			.status(200)
			.set('Content-type', mimeType)
			.end(fileContent)

	}
	return res
		.status(404)
		.set('Content-type', 'text/html')
		.end('not found.')

})

async function startServer() {
	try {
		const port = await getPort()
		server.listen(port)
		console.log(`Server started on port ${port}. Trying to open your web browser now.`)
		opn(`http://localhost:${port}`)
	} catch (err) {
		console.error('Oops. An error occured.')
		console.error(err)
		throw err
	}
}

startServer()
