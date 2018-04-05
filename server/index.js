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
            tempCont.release();
            Promise.all(promises).then((res) => {
              // console.log('res', res);
              resp.json(res);
            });
          }
        });
    }
  });
});

async function getPartidos(tempCont, group) {
  return await new Promise((resolve, reject) => {
    tempCont.query(`SELECT partidos.idPartido, partidos.fechaPartido, EA.nombre as NombreA, EB.nombre as NombreB, EA.keyname as keynameA, EB.keyname as keynameB
    FROM partidos
    INNER JOIN equipopais EA ON partidos.equipoPaisA = EA.idEquipoPais
    INNER JOIN equipopais EB ON partidos.equipoPaisB = EB.idEquipoPais
    WHERE partidos.equipoPaisA IN (SELECT idEquipoPais FROM equipopais WHERE equipopais.grupo = '${group}' )
    OR partidos.equipoPaisB IN (SELECT idEquipoPais FROM equipopais WHERE equipopais.grupo = '${group}' )
    ORDER BY partidos.idPartido`, (error, results, fields) => {
        // tempCont.release();
        if (!!error) {
          console.log('Error in query');
        } else {
          let grupo = null;
          grupo = {
            grupo: group,
            partidos: results
          }
          resolve(grupo);
        }
      });
  });
}

app.listen('1337');