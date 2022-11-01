const express = require("express");
const app = express();

const session = require('express-session');
const path = require('path');
var bodyParser = require('body-parser');
var expressWs = require('express-ws')(app);

const { Pool } = require('pg')
const client = new Pool({
  user: 'scv',
  host: 'localhost',
  database: 'scv_db',
  password: 'xNuwkN2N67Kieu8XrNKo',
  port: 5432,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 0,
})

client.connect() 
var usernames = []

var wscts = {}


app.set("view engine", "hbs");
app.use('/css', express.static('css'));
app.use('/img', express.static('img'));
app.use('/client', express.static('client')); 
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 

app.use(bodyParser.text({type: '*/*'}))

app.ws('/new_message', async function(ws, req) {
  ws.on('message', function(msg) { 
    console.log(msg);
  });
  w = await ws
  console.log('connection established:', w, req.session.userid)
  
  wscts[req.session.userid] = w
  ws.on('close', function() {
    console.log('The connection was closed!');
  });
  console.log(wscts)
});

app.use("/favicon.ico", function(req, res){
  res.sendfile('img/Photo.ico')
})



app.use("//", async function(request, response) {
 
  if(request.session.loggedin){
    data_friends_promis = client.query(`select id, username, status, photo, width from friendlist join users on users.id = friendlist.friend_2 where friendlist.friend_1 = '${request.session.userid}' `);
    data_req_promis = client.query(`SELECT sender, username from active_requests join users on users.id = sender WHERE reciver = '${request.session.userid}'`);
    
    let data_friends = await data_friends_promis;
    let data_req = await data_req_promis; 

    request.session.friends = data_friends.rows; 

    content = {'data_fr': data_friends.rows, 'f_req': data_req.rows, 'message': request.session.message}
    
    request.session.message = ''

    response.render("cons.hbs", content); 
    
  }
  else{
    response.sendFile(path.join(__dirname + '/views/login.html'));
  }
}); 
//главная страничка, отдающая только html
app.use("//", async function(request, response) {
  if(request.session.loggedin){
    response.sendFile(path.join(__dirname + "mainpage.html"));
  }
  else{
    response.sendFile(path.join(__dirname + '/views/login.html'));
  }
});
 
app.use('/get_friends', async function(request, response){
  
})

app.post('/auth', function(request, response) {

 
    let username = request.body.username;
    let password = request.body.password;
    if (username && password) {
        client.query(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`, function(error, results, fields) {
         
          if (error) {
          return 0;}

          if (results.rowCount > 0) {
            request.session.loggedin = true;
            request.session.username = username;
            request.session.userid = results.rows[0].id
            
            response.redirect('https://scv.forshielders.ru/');
        } else {
          
          response.redirect('https://scv.forshielders.ru/');
        }			
        response.end();
      });
    }
});
    
app.post('/find', function(request, response) {
  let findid = request.body.findid;
  if (findid) {
    try{
      
      client.query(`INSERT INTO friendlist VALUES ('${request.session.userid}', '${findid}')`, function(error, results, fields) {
      
        if (error) console.log( error )
        else { 
          client.query(`INSERT INTO active_requests VALUES ('${request.session.userid}', '${findid}')`)
          request.session.message = "Запрос в друздя отправлен";
          response.redirect('https://scv.forshielders.ru/');
      }			
    });
  }
  catch(e){
    
    request.session.message = "Этот контакт уже у вас в друзьях!"
    response.redirect('https://scv.forshielders.ru/');
  }
  }
});

app.post('/reg', function(request, response) {
  try{

      let username = request.body.username;
      let password = request.body.password;

    try{ 
    if (username && password) {
      
        if (usernames.find(el => el.username == username)) {

          response.redirect('https://scv.forshielders.ru/');

        } else {

          client.query(`INSERT INTO "users" (username, password, status, width) VALUES ('${username}',  '${password}', true, 200)`, (err, res) => {
            if (err) {
            } else {
              
            }
          })
          response.redirect('https://scv.forshielders.ru/');
        }			
        response.end();
      };
    }
    catch(e){

    }
  }
  
  catch(err){
    
  };
})

app.use('/add', async function(request, response){
  try{
    let new_friend = request.body.friend_id
    client.query(`INSERT INTO friendlist VALUES ('${request.session.userid}', '${new_friend}')`) 
    client.query(`DELETE FROM active_requests WHERE reciver = ${request.session.userid} and sender = ${new_friend}`)
    request.session.message = "Контакт добавлен!"
  }
  catch{
    request.session.message = "Ошибка при добавлении контакта"
  }
  response.redirect('https://scv.forshielders.ru/');
})

app.use('/logout', async function(req, res){
  req.session.destroy();
  res.redirect('https://scv.forshielders.ru/');
})

app.use('/conts/:id/send', async function(request, response){

  
  client.query(`INSERT INTO messages (sender, reciver, text, time) VALUES ('${request.session.userid}', '${request.params.id}', '${request.body}', $1)`, [new Date()])

  console.log(wscts)
  console.log(`Тут я пробую отправить ${request.params.id} по адресу ${wscts[request.params.id]} ${request.body}`)
  wscts[request.params.id].send(request.body)
}) 

app.use('/rmfriend', async function(request, response){
  console.log(request.body)
  let rmfriend_promice = client.query(`delete from friendlist where friend_1 = ${request.session.userid} and friend_2 = ${request.query.friend}`);

  let rmfriend = await rmfriend_promice;

  response.redirect('https://scv.forshielders.ru/');

})

app.use('/blacklist', async function(request, response){
  let rmfriend_promice = client.query(`delete from friendlist where friend_1 = ${request.session.userid} and friend_2 = ${request.query.friend} or friend_2 = ${request.session.userid} and friend_1 = ${request.query.friend}`);

  let rmfriend = await rmfriend_promice;

  response.redirect('https://scv.forshielders.ru/'); 

})


app.use('/conts/:id', async function (request, res) {
 
    data_user_promice = client.query(`select * from users where id = ${request.params.id}`);
    old_msgs_promice = client.query(`select messages.sender, messages.reciver, messages."text", users.username from messages join users on messages.sender = users.id where sender in (${request.params.id}, ${request.session.userid}) and reciver in (${request.params.id}, ${request.session.userid}) order by "time" `)

    let data_user = await data_user_promice;
    let old_msgs = await old_msgs_promice;

    res.render("contact", {"info": data_user.rows[0], "msgs": old_msgs.rows, 'my_username': request.session.username})
  });



app.use("//", function(_, response) {
    response.render("cons.hbs",
      Object.keys(conts).map(a => ({"id": a, ...conts[a]}))
    );
    
});

app.use("*", function (req, res) {
    res.status(404).send("НЕВЕРНАЯ ССЫЛКА, СМОТРИ ЧТО ПЕЧАТАЕШЬ, ФРИК");
  });

  app.listen(4444);
