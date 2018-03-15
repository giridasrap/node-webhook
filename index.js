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

    /*
      Intent:       welcome-user_id_available - no
      Action:       welcome-user_id_available.welcome-user_id_available-no
      Description:  User said no; he did not have User Id for Welcome message.
      Output:       Send the user list back  
    */
    'welcome-user_id_available.welcome-user_id_available-no' : () => {
      console.log("Intent: welcome-user_id_available - no");
      console.log("Action: welcome-user_id_available.welcome-user_id_available-no");
      let outputMessage = getAllUserIdsOutput();
      res.json(outputMessage);
      console.log('====================================');
    },

    /*
      Intent:       userlist
      Action:       userlist
      Description:  User is asking for the list again.
      Output:       Send the user list back  
    */
   'userlist' : () => {
    console.log("Intent: userlist");
    console.log("Action: userlist");
    let outputMessage = getAllUserIdsOutput();
    res.json(outputMessage);
    console.log('====================================');
  },

    /*
      Intent:       welcome-user_id_available - no - user-basic-details-with-sno
      Action:       welcome-user_id_available.welcome-user_id_available-no.welcome-user_id_available-no-user-basic-details-with-sno
      Description:  User said no; he did not have User Id for Welcome message. User list was provided and user chose a particular S No
      Output:       Send the user list back. If invalid S No is provided send proper list back again  
    */

    'welcome-user_id_available.welcome-user_id_available-no.welcome-user_id_available-no-user-basic-details-with-sno' : () => {
      console.log("Intent: welcome-user_id_available - no - user-basic-details-with-sno");
      console.log("Action: welcome-user_id_available.welcome-user_id_available-no.welcome-user_id_available-no-user-basic-details-with-sno");
      let outputMessage = getBasicDetailsWithSno(parameters['sno'],inputContexts);
      res.json(outputMessage);
      console.log('====================================');
    },

    /*
      Intent:       userlist - user-basic-details-with-sno
      Action:       userlist.userlist-user-basic-details-with-sno
      Description:  User list was provided and user chose a particular S No
      Output:       Send the user list back. If invalid S No is provided send proper list back again  
    */

   'userlist.userlist-user-basic-details-with-sno' : () => {
    console.log("Intent: userlist - user-basic-details-with-sno");
    console.log("Action: userlist.userlist-user-basic-details-with-sno");
    let outputMessage = getBasicDetailsWithSno(parameters['sno'],inputContexts);
    res.json(outputMessage);
    console.log('====================================');
  },

    /*
      Intent:       welcome-user_id_available - yes
      Action:       welcome-user_id_available.welcome-user_id_available-yes
      Description:  User said yes for Welcome message and supplied user id. 
      Output:       For correct user id send the user details. If invalid user id is provided send proper list back again  
    */

    'welcome-user_id_available.welcome-user_id_available-yes' : () => {
      console.log("Intent: welcome-user_id_available - yes");
      console.log("Action: welcome-user_id_available.welcome-user_id_available-yes");
      let outputMessage = getBasicDetailsWithUserId(parameters['user-id']);
      res.json(outputMessage);
      console.log('====================================');
    },

    /*
      Intent:       user-basic-details-with-id
      Action:       user-basic-details-with-id
      Description:  User directly asked for details by supplied user id. 
      Output:       For correct user id send the user details. If invalid user id is provided send proper list back again  
    */

   'user-basic-details-with-id' : () => {
    console.log("user-basic-details-with-id");
    console.log("Action: user-basic-details-with-id");
    let outputMessage = getBasicDetailsWithUserId(parameters['user-id']);
    res.json(outputMessage);
    console.log('====================================');
  },

    /*
      Intent:       user-additional-details-wo-userid
      Action:       user-additional-details-wo-userid
      Description:  User has asked for additional details. 
      Output:       Based on user request, send designation/experience or both  
    */

   'user-additional-details-wo-userid' : () => {
    console.log("Intent: user-additional-details-wo-userid");
    console.log("Action: user-additional-details-wo-userid");
    //console.log(JSON.stringify(inputContexts));
    let userId = getUserIdFromInputContext(inputContexts)
    let outputMessage = getAdditionalDetailsWithUserId(userId, inputContexts);
    res.json(outputMessage);
    console.log('====================================');
  },

    /*
      Intent:       user-additional-details-with-userid
      Action:       user-additional-details-with-userid
      Description:  User has asked for additional details directly by specifying User Id. 
      Output:       Based on user request, send designation/experience or both. If invalid User Id is sent, send the user list back.  
    */

   'user-additional-details-with-userid' : () => {
    console.log("Intent: user-additional-details-with-userid");
    console.log("Action: user-additional-details-with-userid");
    let outputMessage = getAdditionalDetailsWithUserId(parameters['user-id'],inputContexts);
    res.json(outputMessage);
    console.log('====================================');
   } /*,
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
      console.log("User id is "+inputContexts[0].parameters['id']);
      console.log("User band is "+inputContexts[0].parameters['band']);
      console.log("User experience is "+inputContexts[0].parameters['experience']);
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
      let text = "Here are the user Ids that I can help you with.\n";
      for(var i=0; i<listOfUsers.length;i++){
        //console.log('S.no : '+listOfUsers[i].sNo+' ==> Id : '+listOfUsers[i].id+'\n');
        text+= listOfUsers[i].sNo+'. '+listOfUsers[i].id+'\n';
      }

      responseToUser.speech = text+'Can you give me the S No of the specific user that you are interested in?';
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
    }*/
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

function getAllUserIdsOutput() {
  
  let listOfUsers = getAllUserIds();
  
  //This will hold the outputs for speech and displayText
  let responseToUser = {};
  let text = "Here are the User Ids that I can help you with:\n";
  for (var i = 0; i < listOfUsers.length; i++) {
    //console.log('S.no : '+listOfUsers[i].sNo+' ==> Id : '+listOfUsers[i].id+'\n');
    text += listOfUsers[i].sNo + '. ' + listOfUsers[i].id + '\n';
  }

  responseToUser.speech = text + 'Can you give me the S No (1 - '+listOfUsers.length+') of the specific user that you are interested in?';
  responseToUser.displayText = text + '. Can you give me the S No of the specific user that you are interested in?';
  const CONTEXT_TEXT = [{ 'name': 'expecting_userlist', 'lifespan': 1, 'parameters': { 'userlist': listOfUsers } }];
  responseToUser.contextOut = CONTEXT_TEXT;
  return responseToUser;
}

function getBasicDetailsWithSno(sno, inputContexts) {

  let responseToUser = {};

  //Check for user Id match
  let userId = getUserIdFromSno(sno, inputContexts);
  let details = getUserDetails(userId);

  //match not found
  if (details == 0) {
    let listOfUsers = getAllUserIds();
    let text = "Please choose a valid S No from the following:\n";
    for (var i = 0; i < listOfUsers.length; i++) {
      //console.log('S.no : '+listOfUsers[i].sNo+' ==> Id : '+listOfUsers[i].id+'\n');
      text += listOfUsers[i].sNo + '. ' + listOfUsers[i].id + '\n';
    }

    responseToUser.speech = text + 'Can you give me the S No (1 - ' + listOfUsers.length + ') of the specific user that you are interested in?';
    responseToUser.displayText = text + '. Can you give me the S No of the specific user that you are interested in?';
    const CONTEXT_TEXT = [{ 'name': 'expecting_userlist', 'lifespan': 1, 'parameters': { 'userlist': listOfUsers } }, 
                          { 'name': 'welcome-user_id_available-no-followup', 'lifespan': 1, 'parameters': {} },
                          { 'name': 'user-id', 'lifespan': 0, 'parameters': {}} ];
    responseToUser.contextOut = CONTEXT_TEXT;

  } else {
    responseToUser.speech = 'The user you are looking for is ' + details.name + '.\n Email Id of the user is ' + details.email + ' and is currently working in ' + details.project + '.\n Would you like to know about the designation or the total experience or both, additionally?';
    responseToUser.displayText = 'The user you are looking for is ' + details.name + '.\n Email Id of the user is ' + details.email + ' and is currently working in ' + details.project + '.\n Would you like to know about the designation or the total experience or both, additionally?';
    responseToUser.contextOut = [{ 'name': 'expecting_id', 'lifespan': 1, 'parameters': { 'user-id': details.id } }];
  }

  return responseToUser;
}

function getBasicDetailsWithUserId(userId) {
  var details = getUserDetails(userId);

  let responseToUser = {};
  //match not found
  if (details == 0) {
    let listOfUsers = getAllUserIds();
    let text = "Valid User Ids are given below:\n";
    for (var i = 0; i < listOfUsers.length; i++) {
      //console.log('S.no : '+listOfUsers[i].sNo+' ==> Id : '+listOfUsers[i].id+'\n');
      text += listOfUsers[i].sNo + '. ' + listOfUsers[i].id + '\n';
    }

    responseToUser.speech = text + 'Can you give me the S No (1 - ' + listOfUsers.length + ') of the specific user that you are interested in?';
    responseToUser.displayText = text + '. Can you give me the S No of the specific user that you are interested in?';
    const CONTEXT_TEXT = [{ 'name': 'expecting_userlist', 'lifespan': 1, 'parameters': { 'userlist': listOfUsers } }, 
                          { 'name': 'welcome-user_id_available-no-followup', 'lifespan': 1, 'parameters': {} },
                          { 'name': 'expecting_id', 'lifespan': 0, 'parameters': {}} ];
    responseToUser.contextOut = CONTEXT_TEXT;

  } else {
    responseToUser.speech = 'The user you are looking for is ' + details.name + '.\nEmail Id of the user is ' + details.email + ' and is currently working in ' + details.project + '.\n Would you like to know about the designation or the total experience or both, additionally?';
    responseToUser.displayText = 'The user you are looking for is ' + details.name + '.\n Email Id of the user is ' + details.email + ' and is currently working in ' + details.project + '.\n Would you like to know about the designation or the total experience or both, additionally?';
    //responseToUser.contextOut = [{ 'name': 'expecting_id', 'lifespan': 1, 'parameters': { 'id': details.id } }];
  }

  return responseToUser;
}

function getAdditionalDetailsWithUserId(userId, inputContexts) {
  console.log("user id passed is "+userId)
  let responseToUser = {};
  //const ID = inputContexts[0].parameters['user-id'].id;
  var details = getUserDetails(userId);
  if (details == 0) {
    let listOfUsers = getAllUserIds();
    let text = "Valid User Ids are given below:\n";
    for (var i = 0; i < listOfUsers.length; i++) {
      //console.log('S.no : '+listOfUsers[i].sNo+' ==> Id : '+listOfUsers[i].id+'\n');
      text += listOfUsers[i].sNo + '. ' + listOfUsers[i].id + '\n';
    }

    responseToUser.speech = text + 'Can you give me the S No (1 - ' + listOfUsers.length + ') of the specific user that you are interested in?';
    responseToUser.displayText = text + '. Can you give me the S No of the specific user that you are interested in?';
    const CONTEXT_TEXT = [{ 'name': 'expecting_userlist', 'lifespan': 1, 'parameters': { 'userlist': listOfUsers } }, 
                          { 'name': 'welcome-user_id_available-no-followup', 'lifespan': 1, 'parameters': {} },
                          { 'name': 'expecting_id', 'lifespan': 0, 'parameters': {}} ];
    responseToUser.contextOut = CONTEXT_TEXT;

  } else {
    console.log("Matching id found, proceeding to set response")
    let text = "";

    if (inputContexts[0].parameters['both']) {

      text+='The designation of '+details.name+' is '+details.band+'.\n';
      text+='The total experience of '+details.name+' is '+details.experience+'.\n Is there anything else I can help you with?';

    } else {
      if (inputContexts[0].parameters['band']) {

        text += 'The designation of ' + details.name + ' is ' + details.band + '.\n';
      } if (inputContexts[0].parameters['experience']) {

        text += 'The total experience of ' + details.name + ' is ' + details.experience + '.\n';
      }
      text += 'Is there anything else I can help you with?';
    }
    responseToUser.speech = text;
    responseToUser.displayText = text;
    //responseToUser.contextOut = [{ 'name': 'expecting_id', 'lifespan': 1, 'parameters': { 'id': details.id } }];
  }
  return responseToUser;
}

function getUserIdFromInputContext(inputContexts){
  for(var i=0; i< inputContexts.length; i++){
    if(inputContexts[i].name == 'expecting_id'){
        console.log("matching user id found from context "+inputContexts[i].parameters['user-id']);
      return inputContexts[i].parameters['user-id'];
    }
    //console.log(JSON.stringify(inputContexts[i]));
  }
}