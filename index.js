//тут есть  код

const express = require("express");
const app = express();
const { fetch } = require('node-fetch')

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


class Client_connect{ 
  constructor(tablename){
      this.tablename = tablename
  }

  async GET(jsn){
      console.log('->', jsn)
      jsn.keys = jsn.keys.toString();

      let where_search_str = ''
      if(Object.keys(jsn.where).length != 0)
          where_search_str = ' WHERE '
          for(let i of Object.keys(jsn.where)){
              where_search_str += i.toString() + "='" + jsn.where[i] + "',";
          }
          where_search_str = where_search_str.slice(0, -1);
      console.log(`SELECT ${jsn.keys} FROM ${this.tablename}${where_search_str}`)   
      let request_promis = client.query(`SELECT ${jsn.keys} FROM ${this.tablename}${where_search_str}`) 
      let request = await request_promis;
      this.request = request.rows;
  }

  async PUST(jsn){
      if(jsn.id){
          let set = '';
          for(let i of Object.keys(jsn)){
              if(jsn[i] != null)
                  set += i.toString() + " = '" + jsn[i].toString() + "', ";
              else
                  set += i.toString() + ' = null, ';
          }
          let request_promis = client.query(`UPDATE ${this.tablename} SET ${set.slice(0, -2)} WHERE id = ${jsn.id}`);
          console.log(`UPDATE ${this.tablename} SET ${set.slice(0, -2)} WHERE id = ${jsn.id}`);
          let request = await request_promis;
          this.request = request;
      }
      else{
          let keys = [];
          let values = [];
          for(let i of Object.keys(jsn)){
              keys.push(i);
              if(jsn[i] != null)
                  values.push("'" + jsn[i].toString() + "'");
              else
                  values.push("'" + null + "'");
          }
          keys = keys.toString();
          values = values.toString();
          let request_promis = client.query(`INSERT INTO ${this.tablename} (${keys}) VALUES (${values})`);
          let request = await request_promis;
          console.log(`INSERT INTO ${this.tablename} (${keys}) VALUES (${values})`);
          console.log(request) 
          this.request = request;
      }
  }
  
  async DELETE(jsn){
      let where = ''
      for(let i of Object.keys(jsn)){
          if(jsn[i] != null)
              where += i.toString() + " = '" + jsn[i].toString() + "', ";
          else
              where += i.toString() + ' = null, ';
      }
      let request_promis = client.query(`DELETE FROM ${this.tablename} WHERE ${where.slice(0, -2)}`)
      this.request = await request_promis;
  }
}

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
    
  });
  w = await ws
  
  wscts[req.session.userid] = w
  ws.on('close', function() {
  });
});
 
app.use("/favicon.ico", function(req, res){
  res.sendfile('img/Photo.ico')
})
 
app.use("/get_table", async function(request, response){
  if(request.method == "POST" || request.method == "PUT"){ 
    let new_con = new Client_connect(request.body.table)
    await new_con.PUST(request.body.items)
    response.send('ok.')
  }
  if(request.method == "GET"){
    let new_con = new Client_connect(request.query.table)
    await new_con.GET({'keys': request.query.keys, 'where': {}}) 
    response.send(new_con.request)
  }
  if(request.method == "DELETE"){
    let new_con = new Client_connect(request.query.table)
    await new_con.DELETE({'id': request.query.id})
    response.send('ok.')
  }
  
})

app.use("//", async function(request, response) {
 
  if(request.session.loggedin){
    data_friends_promis = client.query(`select id, username, status, photo, width from friendlist join users on users.id = friendlist.friend_2 where friendlist.friend_1 = '${request.session.userid}' `);
    data_req_promis = client.query(`SELECT sender, username from active_requests join users on users.id = sender WHERE reciver = '${request.session.userid}'`);
    //console.log(`select id, username, status, photo, width from friendlist join users on users.id = friendlist.friend_2 where friendlist.friend_1 = '${request.session.userid}' `)
    
    let data_friends = await data_friends_promis;
    let data_req = await data_req_promis; 


    request.session.friends = data_friends.rows;
    //console.log("data_friends.rows =", data_friends);  

    content = {'data_fr': data_friends.rows, 'f_req': data_req.rows, 'message': request.session.message}
    console.log("content  = ", content)
    request.session.message = ''

    response.render("cons.hbs", content); 
    
  }
  else{
    response.sendFile(path.join(__dirname + '/views/login.html'));
  }
}); 
 
  

app.post('/auth', function(request, response) {

 
    let username = request.body.username;
    let password = request.body.password;
    if (username && password) {
        client.query(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`, function(error, results, fields) {
         
          // If there is an issue with the query, output the erro
          if (error) {//console.log( error )
          return 0;}
          // If the account exists
          if (results.rowCount > 0) {
            request.session.loggedin = true;
            request.session.username = username;
            request.session.userid = results.rows[0].id
              
            response.redirect('https://scv.forshielders.ru/');
        } else {
          //sos('Incorrect Username and/or Password!');
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
      //   не хватает проверки уникальности дружбы
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
    //console.log(e)
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
          
          //тут нужно вывесить ошибку

          response.redirect('https://scv.forshielders.ru/');
        } else {

          client.query(`INSERT INTO "users" (username, password, status, width) VALUES ('${username}',  '${password}', true, 200)`, (err, res) => {
            if (err) {
              //console.log(err.stack)
            } else {
              //refresh().then(//console.log('success') );
            }
          })
          response.redirect('https://scv.forshielders.ru/');
        }			
        response.end();
      };
    }
    catch(e){ 
      ////console.log(e)
    }
  }
  
  catch(err){
    ////console.log(err);
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
  wscts[request.params.id].send(request.body)

}) 

app.use('/rmfriend', async function(request, response){
  
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

    //console.log(old_msgs.rows, request.session.username)
    res.render("contact", {"info": data_user.rows[0], "msgs": old_msgs.rows, 'my_username': request.session.username})
  });



app.use("//", function(_, response) {
    response.render("cons.hbs",
      Object.keys(conts).map(a => ({"id": a, ...conts[a]}))
    );
    //console.log()
});

app.use("*", function (req, res) {
    res.status(404).send("НЕВЕРНАЯ ССЫЛКА, СМОТРИ ЧТО ПЕЧАТАЕШЬ, ФРИК");
  });

  app.listen(4444);
