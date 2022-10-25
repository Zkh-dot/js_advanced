//тут есть  код

const express = require("express");
const session = require('express-session');
const path = require('path');
var bodyParser = require('body-parser');

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


const app = express();
app.set("view engine", "hbs");

app.use('/css', express.static('css'));
app.use('/img', express.static('img')); 
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("//", async function(request, response) {
 
  if(request.session.loggedin){
    data_friends_promis = client.query(`select id, username, status, photo, width from friendlist join users on users.id = friendlist.friend_2 where friendlist.friend_1 = '${request.session.userid}' `);
    data_req_promis = client.query(`SELECT sender, username from active_requests join users on users.id = sender WHERE reciver = '${request.session.userid}'`);
    console.log(`select id, username, status, photo, width from friendlist join users on users.id = friendlist.friend_2 where friendlist.friend_1 = '${request.session.userid}' `)
    
    let data_friends = await data_friends_promis;
    let data_req = await data_req_promis; 

    request.session.friends = data_friends.rows;
    console.log("data_friends.rows =", data_friends);  

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
          if (error) {console.log( error )
          return 0;}
          // If the account exists
          if (results.rowCount > 0) {
            request.session.loggedin = true;
            request.session.username = username;
            request.session.userid = results.rows[0].id
            
            response.redirect('http://scv.forshielders.ru/');
        } else {
          //sos('Incorrect Username and/or Password!');
          response.redirect('http://scv.forshielders.ru/');
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
          response.redirect('http://scv.forshielders.ru/');
      }			
    });
  }
  catch(e){
    console.log(e)
    request.session.message = "Этот контакт уже у вас в друзьях!"
    response.redirect('http://scv.forshielders.ru/');
  }
  }
});

/*
    тут будет получение сообщений
    запрос в бд:
    select * from messages where sender = ${} or reciver = ${} or sender = ${} or reciver = ${} order by "time" 
    можно пока написать просто загрузку, а завтра доделать сокетом
    а можно нет 
    хз
*/

app.post('/reg', function(request, response) {
  try{

      let username = request.body.username;
      let password = request.body.password;

    try{ 
    if (username && password) {
      
        if (usernames.find(el => el.username == username)) {
          
          //тут нужно вывесить ошибку

          response.redirect('http://scv.forshielders.ru/');
        } else {

          client.query(`INSERT INTO "users" (username, password, status, width) VALUES ('${username}',  '${password}', true, 200)`, (err, res) => {
            if (err) {
              console.log(err.stack)
            } else {
              //refresh().then(console.log('success') );
            }
          })
          response.redirect('http://scv.forshielders.ru/');
        }			
        response.end();
      };
    }
    catch(e){
      //console.log(e)
    }
  }
  
  catch(err){
    //console.log(err);
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
  response.redirect('http://scv.forshielders.ru/');
})


app.use('/conts/:id', async function (request, res) {
    //  ошибка в том, что request.params.id = id юзера
    //  возможные решения: 
    //  убрать хранение друзей в памяти и делать sql запрос каждый раз
    //  плюсы: снимат нагрузку с оперативки
    //  минусы: предположительно увеличивает время отклика
    //
    //  запоминать id юзеров по расположению на странице
    //  плюсы: быстрое время отклика
    //  минусы: я пидорас (и у леши возможно кончится оперативка на сервере)
    data_user_promice = client.query(`select * from users where id = ${request.params.id}`);

    let data_user = await data_user_promice;

    console.log(data_user.rows)
    res.render("contact", data_user.rows[0])
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
