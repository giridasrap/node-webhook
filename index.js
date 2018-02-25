const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())
app.set('port', (process.env.PORT || 5000))

const REQUIRE_AUTH = false
const AUTH_TOKEN = 'an-example-token'

app.get('/', function (req, res) {
  res.send('Use the /webhook endpoint.')
})
app.get('/webhook', function (req, res) {
  res.send('You must POST your request')
})

app.post('/webhook', function (req, res) {
  // we expect to receive JSON data from api.ai here.
  // the payload is stored on req.body
  console.log(req.body)

  // we have a simple authentication
  if (REQUIRE_AUTH) {
    if (req.headers['auth-token'] !== AUTH_TOKEN) {
      return res.status(401).send('Unauthorized')
    }
  }

  // and some validation too
  if (!req.body || !req.body.result || !req.body.result.parameters) {
    return res.status(400).send('Bad Request')
  }

  // the value of Action from api.ai is stored in req.body.result.action
  console.log('* Received action -- %s', req.body.result.action)

  // parameters are stored in req.body.result.parameters
  var userName = req.body.result.parameters['given-name']
  /* var webhookReply = 'Hello ' + userName + '! Welcome from the webhook.'

  // the most basic response
  res.status(200).json({
    source: 'webhook',
    speech: webhookReply,
    displayText: webhookReply 
  })*/

  var output = sendUsernameResponse(userName);
  res.status(200);
  res.write(output);
})

app.listen(app.get('port'), function () {
  console.log('* Webhook service is listening on port:' + app.get('port'))
})

function sendUsernameResponse(username){
  let responseJson = {}
  responseJson.speech = username+' is a man. He is 6 feet tall and weighs 85 kilograms';
  responseJson.displayText = username+' is a man. He is 6 feet tall and weighs 85 kilograms';
  var contextStr = '[{"name":"expecting_username", "lifespan":1, "parameters":{username:'+username+'}}]';
  var contextObj = JSON.parse(contextStr);
  responseJson.contextOut = contextObj;
  console.log('Response:'+JSON.stringify(responseJson));
  response.json(responseJson);
}