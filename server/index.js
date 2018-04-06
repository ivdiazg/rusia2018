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
              // console.log('res', JSON.stringify(res));
              resp.json(res);
            });
          }
        });
    }
  });
});

async function getPartidos(tempCont, group) {
  return await new Promise((resolve, reject) => {
    // tempCont.query(`SELECT partidos.idPartido, partidos.fechaPartido, EA.nombre as NombreA
    //   , apuestas.golesA, apuestas.golesB, EB.nombre as NombreB, EB.nombre as NombreB
    //   , EA.keyname as keynameA, EB.keyname as keynameB, partidos.habilitado
    //   FROM partidos
    //   INNER JOIN equipopais EA ON partidos.equipoPaisA = EA.idEquipoPais
    //   INNER JOIN equipopais EB ON partidos.equipoPaisB = EB.idEquipoPais
    //   LEFT JOIN apuestas ON partidos.idPartido = apuestas.partido_apuesta AND apuestas.participante = 1
    //   WHERE partidos.equipoPaisA IN (SELECT idEquipoPais FROM equipopais WHERE equipopais.grupo = '${group}' )
    //   OR partidos.equipoPaisB IN (SELECT idEquipoPais FROM equipopais WHERE equipopais.grupo = '${group}' )
    //   ORDER BY partidos.idPartido`, (error, results, fields) => {
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
    var promises = [];
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

app.listen('1337');