/**
 * auth.js
 *
 * Javascript API hosted and running on "www.scriptr.io" to authenticate "GIFsOnDemand" user.
 * This is called from the Sign up/Sign form and username/password passed as POST paramters to this API.
 * This API verify new userid( email) by sending activation link. Users are added in the Firebase DB
 * once validated.
 * Also notify new user registrtion details to the Telegram channel.
 *
 *
 */
var http = require ("http");
var utils = require("/util/util");

const user_status =
{
  NEW_USER: "new_user",
  USER_ACTIVATED: "activated_user",
  EXISTING_USER: "existing_user",
  WRONG_PW: "wrong_password",
  WRONG_TOKEN: "wrong_token",
  NEED_VERIFICATION: "need_verification"
};

var email = request.parameters.email;
var psw = request.parameters.psw;
var token = request.parameters.token;

var message;
var html = "<html>\
			<body>\
            <style> h2 { text-align: center; } \
					.center { \
  								display: flex; \
                                justify-content: center;\
    							align-items: center;\
    							height: 100px;\
							} \
            </style>";


processCurrentUser();

/**
 * Authenticate the current user status and send back the respond.
 * 
 */
function processCurrentUser()
{
    var status = getCurrentUserStatus();

    if((status == user_status.NEW_USER) || 
    (status == user_status.WRONG_TOKEN) ||
    (status == user_status.NEED_VERIFICATION))
    {
        var header;
        var newToken = token;
        if(status == user_status.NEW_USER)
        {
            newToken = appendNewUserToFireBase();
            header = "NEW ACCOUNT EMAIL VERIFICATION";
            
            // Notify new user registrtion details to the Telegram channel
            utils.telegram.sendMessageTeleTBot(879570902, encodeURIComponent("New user registered @ GIFsOnDemand. Email: " + email), require("/config").TELBOTAPI);
        }
        else if(status == user_status.WRONG_TOKEN)
            header = "WRONG ACTIVATION TOKEN PASSED. RETRY EMAIL VERIFICATION";
        else if(status == user_status.NEED_VERIFICATION)
            header = "NEED ACCOUNT EMAIL VERIFICATION";
        
        message = "<h2>" + header + "</h2><br><br><div class=\"center\">" + "Email address(" + email + ") has been added to an account on GIFsOnDemand." + "<br>You must verify email by clicking \"Verify Email\" button before using this site."+ "</div>";

        var activateButton ="<input type=\"button\" onclick=\"location.href='https://api.scriptrapps.io/gifsondemand/auth?auth_token=RzE3ODBBRUI2OA==&token="+
                            newToken + "&email=" + email + "';\" value=\"Verify Email\"/>";
        html += message + "<div class=\"center\">" + activateButton + "</div>" + "</body></html>";
    }
    else if(status == user_status.USER_ACTIVATED)
    {
        message = "<div class=\"center\">" + "Successfully activated account with the userid " + email +
                "<br>Redirecting to the site GifsOnDemand...</div>";
        message += "<script>setTimeout(function(){\
                    location.href=\"https://vltechx.github.io/GifsOnDemand/gallery.html\"; }, 5000);</script>";
        html += message + "</body></html>";
    }
    else if(status == user_status.EXISTING_USER)
    {
        message = "<div class=\"center\">" + "User authenticated with the userid &nbsp;" + email +
                "<br>Redirecting to the site GifsOnDemand...</div>";
        message += "<script>setTimeout(function(){\
                    location.href=\"https://vltechx.github.io/GifsOnDemand/gallery.html\"; }, 5000);</script>";
        html += message + "</body></html>";      
    }
    else if(status == user_status.WRONG_PW)
    {
        message = "<div class=\"center\">" + "Wrong password entered, please enter the correct password." +
                "<br>Redirecting to the site GifsOnDemand...</div>";
        message += "<script>setTimeout(function(){\
                    location.href=\"https://vltechx.github.io/GifsOnDemand/index.html\"; }, 5000);</script>";
        html += message + "</body></html>";
    }
    response.write(html);
    // whenever you manipulate the response object make sure to add your CORS settings to the header
    response.addHeaders(configuration.crossDomainHeaders);
    response.close();
}

/**
 * Returns Firebase httpClient.
 * @return {httpClient} firebase
 * 
 */
function getFirebase()
{
    // Firebase secret for vvsbusbot is used & is stored in modules/firebase/scripts/config.js
    var firebaseModule = require("/modules/firebase/scripts/firebaseclient.js");
    var dto = {};
	dto.projectName = "https://vvsbusbot.firebaseio.com/";
	var firebase = new firebaseModule.Firebase(dto);
    return firebase;
}

/**
 * Returns all users from database.
 * @return {{"token": newToken, "userid": email, "password": psw, "activated": false}[]} users       
 * 
 */
function getAllUsers()
{
	var firebase = getFirebase();
    var users = firebase.getData("users");
    return users;
}

/**
 * Return an user_status for the current user(e.g. new or existing & verified user).
 * @return {user_status} status
 *          user_status.NEW_USER - If userid not found.
 *          user_status.NEED_VERIFICATION - If userid found but email verification is not completed.
 *          user_status.WRONG_TOKEN - If activated flag is true, userid found but password didn't match & token is null(ask to verify again with token/email).
 *          user_status.USER_ACTIVATED - If userid found with matching token sent in email verification.
 *          user_status.EXISTING_USER - If activated flag is true, userid & password matches but token is null.
 * 
 */
function getCurrentUserStatus()
{
    var status = user_status.NEW_USER;
	var users = getAllUsers();
    
    function getUserIndex(userid)
    {
      	return users.findIndex(function(users)
        {
            if(users)
            	return users.userid == userid;
            return false;
         });
    }
    var userIndex = getUserIndex(email);
	log.info("userIndex - " + userIndex);
    
    if (userIndex >= 0)
    {
        var curUser = users[userIndex];
        log.info("curUser - " + curUser.userid);
       	var match = false;
        if(token)
        {
            match = curUser.token == token;
            status = match ? user_status.USER_ACTIVATED : user_status.WRONG_TOKEN;
            if(match)
            {
                var firebase = getFirebase();
                curUser.activated = true;
                firebase.putData("users/" + userIndex, curUser);
            }
            else  // token didn't match, ask to verify again with correct token/email from db
                token = curUser.token;
        }
        else if(curUser.activated == true)
        {
            log.info("curUser.activated - " + curUser.activated);
            match = curUser.password == psw;
            status = match ? user_status.EXISTING_USER : user_status.WRONG_PW;
        }
        else // User tried to login again without activating
        {
            token = curUser.token;
            status = user_status.NEED_VERIFICATION;                
        }
    }
    return status;
}

/**
 * Append new user to the user database with new unique token.
 * @return {string} newToken
 * 
 */
function appendNewUserToFireBase()
{
   	var newToken = getToken();
	var firebase = getFirebase();
    var users = firebase.getData("users");
    var userIndex =  users.length;

    var data =  {"token": newToken, "userid": email, "password": psw, "activated": false}
    firebase.putData("users/"+userIndex, data);
   
    return newToken;
}

/**
 * Generate and returns new unique token.
 * @return {string} buf
 * 
 */
function getToken(len)
{
    var buf = [],
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    charlen = chars.length,
    length = len || 32;
        
    for (var i = 0; i < length; i++) 
    {
        buf[i] = chars.charAt(Math.floor(Math.random() * charlen));
    }    
    return buf.join('');
}