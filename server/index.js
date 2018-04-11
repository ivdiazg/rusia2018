var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var app = express();

var connection = mysql.createPool({
  connectionLimit: 50,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rusia2018'
});

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

app.use(function (req, res, next) {
  // IE9 doesn't set headers for cross-domain ajax requests
  if (typeof (req.headers['content-type']) === 'undefined') {
    req.headers['content-type'] = "application/json; charset=UTF-8";
  }
  next();
})
  .use(bodyParser.json());

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});

app.get('/groups', (req, resp) => {
  connection.getConnection((error, tempCont) => {
    var promises = [];
    if (!!error) {
      tempCont.release();
      console.log('Error');
    } else {
      tempCont.query(`SELECT grupo FROM equipoPais WHERE competicion_equipoPais = 1 GROUP BY grupo`
        , (error, groups, fields) => {
          // tempCont.release();
          if (!!error) {
            console.log('Error in query');
          } else {
            // resp.json(results);
            for (const group of groups) {
              promises.push(getPartidos(tempCont, group.grupo));
            }
            Promise.all(promises).then((res) => {
              tempCont.release();
              resp.json(res);
            });
          }
        });
    }
  });
});

async function getPartidos(tempCont, group) {
  return await new Promise((resolve, reject) => {
    tempCont.query(`CALL groupsEquipos('${group}', 1)`, (error, results, fields) => {
      // tempCont.release();
      if (!!error) {
        console.log('Error in query');
      } else {
        let grupo = null;
        grupo = {
          group: group,
          matches: results[0]
        }
        resolve(grupo);
      }
    });
  });
}

app.get('/matchesOfTheDay', (req, resp) => {
  connection.getConnection((error, tempCont) => {
    if (!!error) {
      tempCont.release();
      console.log('Error');
    } else {
      participante = 1;
      tempCont.query(`CALL matchesOfTheDay (${participante})`, (error, results, fields) => {
        // tempCont.release();
        if (!!error) {
          console.log('Error in query');
        } else {
          tempCont.release();
          let tiles = [];
          let cols = 0;
          let colspanVal = 0;
          const COLORS = ['lightblue', 'lightgreen', 'lightpink', 'lightyellow'
            , 'lightblue', 'lightgreen', 'lightpink', 'lightyellow'
            , 'lightblue', 'lightgreen', 'lightpink', 'lightyellow'];

          if (results[0].length === 3 || results[0].length > 4) {
            cols = 6;
            colspanVal = 2;
          } else {
            cols = 6;
            colspanVal = 3;
          }

          for (i = 0; i < results[0].length; i++) {
            tiles.push({ colspan: colspanVal, rowspan: colspanVal, color: COLORS[i] });
          }
          send = {
            'cols': cols,
            'tiles': tiles,
            'matches': results[0]
          }
          resp.json(send);
        }
      });
    }
  });
});

app.post('/updApuestaMatch', (req, resp) => {
  var promises = [];
  connection.getConnection((error, tempCont) => {
    if (!!error) {
      tempCont.release();
      console.log('Error');
    } else {
      req.body.forEach(match => {
        promises.push(updApuesta(tempCont, match));
      });
      Promise.all(promises).then((res) => {
        tempCont.release();
        resp.json(res);
      }).catch(err => {
        console.log(err);
      });
    }
  });
});

async function updApuesta(tempCont, match) {
  return await new Promise((resolve, reject) => {
    tempCont.query(`CALL updApuestaMatch (${match.idPartido}, ${match.golesA}, ${match.golesB}, ${match.competicion}, ${match.participante})`
      , (error, groups, fields) => {
        if (!!error) {
          console.log('Error in query');
        } else {
          resolve(true);
        }
      });
  });
}

app.listen('1337');