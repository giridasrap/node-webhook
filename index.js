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
  console.log('====================================================================');
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
  processV1Request(req, res);
 
})

app.listen(app.get('port'), function () {
  console.log('* Webhook service is listening on port:' + app.get('port'))
})

function processV1Request (req, res) {
  let action = req.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = req.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = req.body.result.contexts; // https://dialogflow.com/docs/contexts
  
  //This will hold the outputs for speech and displayText
  let responseToUser = {};

  const actionHandlers = {

    // The intent get basic detailshas been matched
    'input.getbasicdetails': () => {

      console.log('====================================');
      console.log("Received action input.getbasicdetails")
      //Check for user Id match
      var details = getUserDetails(parameters['id']);

      //match not found
      if(details == 0){
        responseToUser.speech = 'Given Id '+parameters['id']+' does not exist. Try a different Id perhaps!!';
        responseToUser.displayText = 'Given Id '+parameters['id']+' does not exist. Try a different Id perhaps!!';
        
      }else{
        responseToUser.speech = 'The employee you are looking for is '+details.name+'. Email Id of the employee is '+details.email+' and is currently working in '+details.project+'. Would you like to know some additional information regarding the designation or the total experience?';
        responseToUser.displayText = 'The employee you are looking for is '+details.name+'. Email Id of the employee is '+details.email+' and is currently working in '+details.project+'. Would you like to know some additional information regarding the designation or the total experience?';
        responseToUser.contextOut = [{'name': 'expecting_id', 'lifespan': 1, 'parameters': {'id': details.id}}];
      }

      res.json(responseToUser);
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.getadditionaldetails': () => {
      console.log('====================================');
      console.log("Received action input.getadditionaldetails")
      console.log("Input context is "+JSON.stringify(inputContexts));
      /*console.log("User id is "+inputContexts[0].parameters['id']);
      console.log("User band is "+inputContexts[0].parameters['band']);
      console.log("User experience is "+inputContexts[0].parameters['experience']);*/
      const ID = inputContexts[0].parameters['id'];
      var details = getUserDetails(ID);
      if(details == 0){
        responseToUser.speech = 'Given Id '+parameters['id']+' does not exist. Try a different Id perhaps!!';
        responseToUser.displayText = 'Given Id '+parameters['id']+' does not exist. Try a different Id perhaps!!';
        responseToUser.outputContexts = [{'name': 'expecting_id', 'lifespan': 0, 'parameters': {'id': details.id}}];
        
      }else{
        console.log("Matching id found, proceeding to set response")
        let text = "";
        
        if(inputContexts[0].parameters['band'].includes('band') || inputContexts[0].parameters['band'].includes('designation')){

          text+='The designation of '+details.name+' is '+details.band+'.';
        }
        if (inputContexts[0].parameters['experience'] == 'experience'){

          text+='The total experience of '+details.name+' is '+details.experience+'.';
        }
        responseToUser.speech = text;
        responseToUser.displayText = text;
      }
      res.json(responseToUser);
    },
    'input.getuserlist' : ()=> {
      console.log('====================================');
      console.log("Received action input.getuserlist");
      let listOfUsers = getAllUserIds();
      let text = "";
      for(var i=0; i<listOfUsers.length;i++){
        //console.log('S.no : '+listOfUsers[i].sNo+' ==> Id : '+listOfUsers[i].id+'\n');
        text+= listOfUsers[i].sNo+'. '+listOfUsers[i].id+'\n';
      }

      responseToUser.speech = text+'. Can you give me the S No of the specific user that you are interested in?';
      responseToUser.displayText = text+'. Can you give me the S No of the specific user that you are interested in?';
      const CONTEXT_TEXT = [{'name': 'expecting_userlist', 'lifespan': 1, 'parameters': {'userlist': listOfUsers}}];
      responseToUser.contextOut = CONTEXT_TEXT;
      res.json(responseToUser);
    },
    'input.specificuser' : ()=> {
      console.log('====================================');
      console.log("Received action input.specificuser");
      console.log("Input context is "+JSON.stringify(inputContexts));

      //Check for user Id match
      let userId = getUserIdFromSno(parameters['sno'],inputContexts);
      let details = getUserDetails(userId);

      //match not found
      if(details == 0){
        responseToUser.speech = 'Given S No '+parameters['sno']+' does not exist';
        responseToUser.displayText = 'Given S No '+parameters['sno']+' does not exist';
        
      }else{
        responseToUser.speech = 'The employee you are looking for is '+details.name+'. Email Id of the employee is '+details.email+' and is currently working in '+details.project+'. Would you like to know some additional information regarding the designation or the total experience?';
        responseToUser.displayText = 'The employee you are looking for is '+details.name+'. Email Id of the employee is '+details.email+' and is currently working in '+details.project+'. Would you like to know some additional information regarding the designation or the total experience?';
        responseToUser.contextOut = [{'name': 'expecting_id', 'lifespan': 1, 'parameters': {'id': details.id}}];
      }
      res.json(responseToUser);
    }
  };

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
}

function sendResponse(res, responseText){

  //Send response json back to the user
  res.json(responseText);
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
    {"name":"Jack","id":"95678","email":"jack@wipro.com","project":"Edgewell","total experience":"17 years", "band":"D1"},
    
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
      console.log("Band :: "+empData.band);
      console.log("Experience :: "+empData.experience);
      return empData;
    }
  }
  return 0;
}

function getAllUserIds(){
  let empData = [];
  let users = userList[0].user;
  for(var i=0; i<users.length; i++){
      var element = {};
      element.sNo = i+1;
      element.id = users[i].id;
     empData.push(element);
  }
  
  return empData;
}

function getUserIdFromSno(serialNo, inputContexts){
  //console.log('Trying to match '+serialNo)
  for(var i=0; i< inputContexts.length; i++){
    
    //console.log(JSON.stringify(ic[i].parameters.userlist))
    
    if(inputContexts[i].name == 'expecting_userlist'){
        
        for(var j=0; j<inputContexts[i].parameters.userlist.length; j++ ){
        
            //console.log(JSON.stringify(inputContexts[i].parameters.userlist[j].sNo)+' : '+JSON.stringify(inputContexts[i].parameters.userlist[j].id))
            
            if(serialNo == inputContexts[i].parameters.userlist[j].sNo){
                
                console.log('Match found!!!!')
                return inputContexts[i].parameters.userlist[j].id;
            }
        }
    }
  } 
  return 0;
}