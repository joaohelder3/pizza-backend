const express = require('express')
const config = require('config')
const pg = require('pg')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || config.get("server.port")
const uri = process.env.DATABASE_URL || config.get("db.uri");
const secret = process.env.JWT_SECRET || config.get("jwt.secret");

console.log("SECRET==>", secret);

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const pool = new pg.Pool ({
    connectionString: uri,
    ssl: {
        rejectUnauthorized: false
    }
})

const filtroJwt = (req, res, proximo) => { 
    console.log("Headers ==>", req.headers);
    // console.log(`Autorization ==> ${req.headers.authorization.substring(0, 6)}`);
    if (req.headers.authorization 
        && req.headers.authorization.substring(0, 6) === "Bearer") { 
        const token = req.headers.authorization.substring(7);
        console.log("Token ==> ", token);
        jwt.verify(token, secret, (err, info) => { 
            if (err) { 
                res.status(403).send("Token inválido");
            } else { 
                proximo();
            }
        });
    } else { 
        res.status(403).send("É necessário um token para acessar este recurso")
    }
}

app.route('/reset').get((req, res) => { 
    let qry = "DROP TABLE IF EXISTS clientes;"
    qry += "CREATE TABLE clientes ("
    qry += "cliente char(100),"
    qry += "peso decimal,"
    qry += "altura decimal,"
    qry += "idade int,"
    qry += "tmb decimal,"
    qry += "imc decimal"
    qry += ");"
    qry += "DROP TABLE IF EXISTS equipamentos;"
    qry += "CREATE TABLE equipamentos ("
    qry += "nome varchar(255),"
    qry += "tipo varchar(255),"
    qry += "quantidade int"
    qry += ");"
    qry += "DROP TABLE IF EXISTS academias;"
    qry += "CREATE TABLE academias ("
    qry += "nome varchar(255),"
    qry += "bairro varchar(255),"
    qry += "logradouro varchar(255)"
    qry += ");"
    qry += "DROP TABLE IF EXISTS usuarios;"
    qry += "CREATE TABLE usuarios ("
    qry += "usuario varchar(50),"
    qry += "email varchar(255),"
    qry += "senha varchar(255),"
    qry += "perfil varchar(25),"
    qry += "nome varchar(100)"
    qry += ");"
    qry += "INSERT INTO usuarios (usuario, email, senha, perfil, nome) "
    qry += "VALUES ('admin', 'antonio@fecaf.com', '123456', 'ADMIN', 'Antonio Rodrigues');";
    console.log(qry);
    pool.query(qry, (err, dbres) => {
        if (err) { 
            res.status(500).send(err)
        } else { 
            res.status(200).send("Banco de dados resetado")
        }
    })
})

app.route('/clientes').get(filtroJwt, (req, res) => {
    console.log("/clientes acionado")
    let qry = "SELECT * FROM clientes;"
    pool.query(qry, (err, dbres) => { 
        if(err) { 
            res.status(500).send(err)
        } else { 
            res.status(200).json(dbres.rows)
        }
    });
})

app.route('/cliente/adicionar').post(filtroJwt, (req, res) => { 
    console.log("/cliente/adicionar acionado")
    let qry = "INSERT INTO clientes (cliente, peso, altura, idade, tmb, imc) "
    qry += ` VALUES ('${req.body.cliente}', '${req.body.peso}', '${req.body.altura}', '${req.body.idade}', '${req.body.tmb}', '${req.body.imc}');`
    //qry += ` VALUES ('${req.body.cliente}', '${req.body.peso}', '${req.body.altura}', '${req.body.idade}', '0', '0');`
    pool.query(qry, (err, dbres) => { 
        if (err) { 
            res.status(500).send(err)
        } else { 
            res.status(200).send("Cliente adicionado com sucesso")
        }
    });
})

app.route('/equipamentos').get(filtroJwt, (req, res) => {
    console.log("/equipamentos acionado")
    let qry = "SELECT * FROM equipamentos;"
    pool.query(qry, (err, dbres) => { 
        if(err) { 
            res.status(500).send(err)
        } else { 
            res.status(200).json(dbres.rows)
        }
    });
})

app.route('/equipamento/adicionar').post(filtroJwt, (req, res) => { 
    console.log("/equipamento/adicionar acionado")
    let qry = "INSERT INTO equipamentos (nome, tipo, quantidade) "
    qry += ` VALUES ('${req.body.nome}', '${req.body.tipo}', '${req.body.quantidade}');`
    pool.query(qry, (err, dbres) => { 
        if (err) { 
            res.status(500).send(err)
        } else { 
            res.status(200).send("Equipamento adicionado com sucesso")
        }
    });
})

app.route('/academias').get(filtroJwt, (req, res) => {
    console.log("/academias acionado")
    let qry = "SELECT * FROM academias;"
    pool.query(qry, (err, dbres) => { 
        if(err) { 
            res.status(500).send(err)
        } else { 
            res.status(200).json(dbres.rows)
        }
    });
})

app.route('/academia/adicionar').post(filtroJwt, (req, res) => { 
    console.log("/academia/adicionar acionado")
    let qry = "INSERT INTO academias (nome, bairro, logradouro) "
    qry += ` VALUES ('${req.body.nome}', '${req.body.bairro}', '${req.body.logradouro});`
    pool.query(qry, (err, dbres) => { 
        if (err) { 
            res.status(500).send(err)
        } else { 
            res.status(200).send("Academia adicionada com sucesso")
        }
    });
})

app.route('/login').post((req, res) => { 
    console.log("Request ==> ", req.body);
    // let qry = `SELECT * FROM usuarios WHERE usuario = '${req.body.usuario}' `;
    // qry += ` AND senha = '${req.body.senha}';`;
    // console.log("Query==>", qry);
    // pool.query(qry, (err, dbres) => {
    let qry = `SELECT * FROM usuarios WHERE usuario = $1 `;
    qry += ` AND senha = $2;`;
    console.log("Query==>", qry);
    pool.query(qry, [req.body.usuario, req.body.senha], (err, dbres) => {        
        if (err) { 
            res.status(500).send(err);
        } else { 
            console.log("Foram encontrados ", dbres.rowCount, " registros");
            console.log(dbres.rows);
            if (dbres.rowCount > 0) { 
                const row = dbres.rows[0];
                console.log("1ª Linha==>", row);
                const payload = {
                    usuario: row.usuario,
                    perfil: row.perfil,
                    nome: row.nome,
                }
                const token = jwt.sign(payload, secret);
                console.log("Token => ", token);
                const objToken = {token};
                res.status(200).json(objToken);
            } else { 
                res.status(401).send("Usuário ou senha inválidos");
            }
        }
    })
});

app.listen(port, () => { 
    console.log("Iniciando o servidor na porta ", port)
})

console.log("Inicio do projeto")