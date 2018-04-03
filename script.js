var express = require('express');
var mysql = require('mysql');
var app = express();

var connection = mysql.createPool({
  connectionLimit: 50,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rusia2018'
});

app.get('/competicion', (req, resp) => {
  connection.getConnection((error, tempCont) => {
    if (!!error) {
      tempCont.release();
      console.log('Error');
    } else {
      console.log('Connected!');
      tempCont.query('SELECT * FROM equipopais', (error, results, fields) => {
        tempCont.release();
        if (!!error) {
          console.log('Error in query');
        } else {
          resp.json(results);
        }
      });
    }
  });
});

app.listen('1337');