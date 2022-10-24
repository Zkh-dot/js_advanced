//тут будет код

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
var passwords = []
// callback
async function refresh(){
  client.query('SELECT username FROM users', (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      usernames = res.rows;
      console.log(usernames)
    }

  })

  client.query('SELECT password FROM users', (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      passwords = res.rows;
      console.log(passwords)
    }
  })
}

const conts = {
    1: {
      "name": "freakadelka",
      "status": "online",
      "prof_photo": "2.jpg",
      "width": "200px"
    },
    2: {
      "name": "Lesha",
      "status": "offline",
      "prof_photo": "1.jpg",
      "width": "200px"
    },
    3: {
      "name": "Масло",
      "status": "freak",
      "prof_photo": "3.jpg",
      "width": "1000px"
    }
};

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

app.use("//", function(request, response) {
  client.query(`SELECT sender, reciver from active_requests  WHERE reciver = '${request.session.userid}'`), function(error, results, fields) {
    console.log(results.rows)
    
  }
  if(request.session.loggedin){
    console.log(`select id, username, status from friendlist join users on users.id = friendlist.friend_2 where friendlist.friend_1 = '${request.session.userid}' `)
    client.query(`select id, username, status from friendlist join users on users.id = friendlist.friend_2 where friendlist.friend_1 = '${request.session.userid}' `, function(error, results, fields) {
      console.log(results.rows)
    
      response.render("cons.hbs", results.rows);
    });
  }
  else
    response.sendFile(path.join(__dirname + '/views/login.html'));
});

app.post('/auth', function(request, response) {


    let username = request.body.username;
    let password = request.body.password;
    console.log(username, password)
    console.log(usernames, passwords)
    if (username && password) {
        // If the account exists
        console.log(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`); 
        client.query(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`, function(error, results, fields) {
         
          console.log(results)
          // If there is an issue with the query, output the erro
          if (error) console.log( error );
          // If the account exists
          if (results.rowCount > 0) {
            request.session.loggedin = true;
            request.session.username = username;
            console.log('---->id =', results.rows[0].id)
            request.session.userid = results.rows[0].id
            console.log(request.session.username)
            response.redirect('http://scv.forshielders.ru/');
        } else {
          //alert('Incorrect Username and/or Password!');
          response.redirect('http://scv.forshielders.ru/');
        }			
        response.end();
      });
    }
});
  
app.post('/find', function(request, response) {
  let findid = request.body.findid;
  if (findid) {
      // If the account exists
      console.log(`INCERT INTO "active_requests" VALUES ('${request.session.userid}', '${findid}')'`); 
      client.query(`INCERT INTO "active_requests" VALUES ('${request.session.userid}', '${findid}')'`, function(error, results, fields) {
       
        console.log(results)
        if (error) console.log( error );
        // If the account exists
        if (results.rowCount > 0) {
          response.redirect('http://scv.forshielders.ru/');
      } else {
        //alert('Incorrect Username and/or Password!');
        response.redirect('http://scv.forshielders.ru/');
      }			
      response.end();
    });
  }
});


app.post('/reg', function(request, response) {
  try{

      let username = request.body.username;
      let password = request.body.password;
      console.log(username, password)
      console.log(usernames, passwords)
    try{ 
    if (username && password) {
      
        if (usernames.find(el => el.username == username)) {
          
          //тут нужно вывесить ошибку

          response.redirect('http://scv.forshielders.ru/');
        } else {
          console.log(`INSERT INTO "users" (username, password, status) VALUES (${username},  ${password}, true)`)
          client.query(`INSERT INTO "users" (username, password, status) VALUES ('${username}',  '${password}', true)`, (err, res) => {
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

/*
app.use('/auth/', function (req, res){
  res.render("auth.hbs",
    Object.keys())
})
*/
app.use('/conts/:id', function (req, res) {
    res.render("contact", conts[req.params.id])
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