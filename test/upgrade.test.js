'use strict'

const { test } = require('node:test')
const Fastify = require('..')
const { connect } = require('node:net')
const { once } = require('node:events')
const dns = require('node:dns').promises

async function setup (t) {
  const localAddresses = await dns.lookup('localhost', { all: true })
  if (localAddresses.length === 1) {
    t.skip('requires both IPv4 and IPv6')
    return
  }

  test('upgrade to both servers', async t => {
    t.plan(2)
    const fastify = Fastify()
    fastify.server.on('upgrade', (req, socket, head) => {
      t.assert.ok(`upgrade event ${JSON.stringify(socket.address())}`)
      socket.end()
    })
    fastify.get('/', (req, res) => {
    })
    await fastify.listen()
    t.after(() => fastify.close())

    {
      const client = connect(fastify.server.address().port, '127.0.0.1')
      client.write('GET / HTTP/1.1\r\n')
      client.write('Upgrade: websocket\r\n')
      client.write('Connection: Upgrade\r\n')
      client.write('Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==\r\n')
      client.write('Sec-WebSocket-Protocol: com.xxx.service.v1\r\n')
      client.write('Sec-WebSocket-Version: 13\r\n\r\n')
      client.write('\r\n\r\n')
      await once(client, 'close')
    }

    {
      const client = connect(fastify.server.address().port, '::1')
      client.write('GET / HTTP/1.1\r\n')
      client.write('Upgrade: websocket\r\n')
      client.write('Connection: Upgrade\r\n')
      client.write('Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==\r\n')
      client.write('Sec-WebSocket-Protocol: com.xxx.service.v1\r\n')
      client.write('Sec-WebSocket-Version: 13\r\n\r\n')
      await once(client, 'close')
    }
  })
}

setup()
