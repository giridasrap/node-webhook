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
  /*var webhookReply = 'Hello ' + userName + '! Welcome from the webhook.'

  // the most basic response
  res.status(200).json({
    source: 'webhook',
    speech: webhookReply,
    displayText: webhookReply 
  })

  console.log("Resonse body: "+ res.body)*/
  //var output = sendUsernameResponse(userName,res);
  // Run the proper handler function to handle the request from Dialogflow

  processV1Request(req, res);
 
})

app.listen(app.get('port'), function () {
  console.log('* Webhook service is listening on port:' + app.get('port'))
})

function processV1Request (req, res) {
  let action = req.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = req.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = req.body.result.contexts; // https://dialogflow.com/docs/contexts

  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.getbasicdetails': () => {
      var details = getUserDetails(parameters['id']);
      if(details == 0){
        let responseToUser = {
          //outputContexts: [{'name': 'expecting_id', 'lifespan': 0, 'parameters': {'id': details.id}}],
          speech:  'Given Id '+parameters['id']+' does not exist. Try a different Id perhaps!!', // spoken response
          displayText:  'Given Id '+parameters['id']+' does not exist. Try a different Id perhaps!!', // displayed response
        };
        res.json(responseToUser);

      }else{
        let responseToUser = {
          outputContexts: [{'name': 'expecting_id', 'lifespan': 1, 'parameters': {'id': details.id}}], 
          speech:  'The employee you are looking for is '+details.name+'. Email Id of the employee is '+details.email+' and is currently working in '+details.project, // spoken response
          displayText:  'The employee you are looking for is '+details.name+'. Email Id of the employee is '+details.email+' and is currently working in '+details.project, // displayed response
        };
        res.json(responseToUser);
      }
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.getadditionaldetails': () => {
      console.log("Input context is "+JSON.stringify(inputContexts));
      console.log("User id is "+inputContexts[0].parameters['id']);
      console.log("User band is "+inputContexts[0].parameters['band']);
      console.log("User experience is "+inputContexts[0].parameters['experience']);
      const ID = inputContexts[0].parameters['id'];
      var details = getUserDetails(inputContexts[0].parameters['id']);
      if(details == 0){
        let responseToUser = {
          //outputContexts: [{'name': 'expecting_id', 'lifespan': 0, 'parameters': {'id': details.id}}],
          speech:  'Given Id '+parameters['id']+' does not exist. Try a different Id perhaps!!', // spoken response
          text:  'Given Id '+parameters['id']+' does not exist. Try a different Id perhaps!!', // displayed response
        };
        res.json(responseToUser);
      }else{
        console.log("Matching id found, proceeding to set response")
        let text = "";
        
        if(inputContexts[0].parameters['band'] == 'band'){
          text+='The designation of '+details.name+' is '+details.band+'.';
        }
        if (inputContexts[0].parameters['experience'] == 'experience'){
          text+='The total experience of '+details.name+' is '+details.experience+'.';
          
        }

        let responseToUser = {
          //outputContexts: [{'name': 'expecting_username', 'lifespan': 1, 'parameters': {'given-name': username}}], // Optional, uncomment to enable
          speech:  text, // spoken response
          displayText:  text, // displayed response
        };
        res.json(responseToUser);
      }
     
      
    }
  };

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
}

var userList = [{"user":[{"name":"Alice","id":"12345","email":"alice@wipro.com","project":"BAT","total experience":"10 years", "band":"B3"},
    {"name":"Bob","id":"23451","email":"bob@wipro.com","project":"Corning","total experience":"8 years", "band":"B2"},
    {"name":"Cruz","id":"34512","email":"cruz@wipro.com","project":"Levis","total experience":"2 years", "band":"B1"},
    {"name":"Danny","id":"45123","email":"danny@wipro.com","project":"Maxis","total experience":"3 years", "band":"B1"},
    {"name":"Elise","id":"51234","email":"elise@wipro.com","project":"Best Buy","total experience":"4 years", "band":"B1"},
    {"name":"Frank","id":"56789","email":"frank@wipro.com","project":"Gallaghar","total experience":"5 years", "band":"B2"},
    {"name":"Greta","id":"67895","email":"greta@wipro.com","project":"Walmart","total experience":"11 years", "band":"C1"},
    {"name":"Hannah","id":"78956","email":"hannah@wipro.com","project":"PETCO","total experience":"12 years", "band":"C1"},
    {"name":"Igor","id":"89567","email":"igor@wipro.com","project":"BT","total experience":"13 years", "band":"C2"},
    {"name":"Jack","id":"95678","email":"jack@wipro.com","project":"Edgewell","total experience":"17 band", "Band":"D1"},
    
    ]
}];

function getUserDetails(inputid){
  var empData = {}
  for(var empid in userList[0].user){
    id = userList[0].user[empid].id;
    //console.log(id);
    if(id == inputid){
      empData.id=userList[0].user[empid].id;
      empData.name = userList[0].user[empid].name;
      empData.email = userList[0].user[empid].email;
      empData.project = userList[0].user[empid].project
      empData.band = userList[0].user[empid].band;
      empData.experience = userList[0].user[empid]['total experience'];
      return empData;
    }
  }
  return 0;
}