const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configurar o Express
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurar conexão com o MongoDB

mongoose.connect("mongodb+srv://tvsantos:AQ6MUM2TWIu4Ap66@flores.wxzleyy.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexão com o banco de dados:'));
db.once('open', function() {
  console.log('Conectado ao banco de dados.');
});

// Definir o modelo do usuário
const UsuarioSchema = new mongoose.Schema({
  nome: String,
  senha: String
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

// Rota de registro de usuário
app.post('/registro', (req, res) => {
  const { nome, senha } = req.body;

  // Verificar se o usuário já existe no banco de dados
  Usuario.findOne({ nome: nome }, (err, usuarioExistente) => {
    if (err) {
      console.error(err);
      res.status(500).send('Erro interno do servidor');
    } else if (usuarioExistente) {
      res.status(400).send('Usuário já registrado');
    } else {
      // Criptografar a senha antes de salvar no banco de dados
      const senhaCriptografada = bcrypt.hashSync(senha, 10);

      const usuario = new Usuario({
        nome: nome,
        senha: senhaCriptografada
      });

      usuario.save((err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Erro interno do servidor');
        } else {
          res.send('Usuário registrado com sucesso');
        }
      });
    }
  });
});

// Rota de login
app.post('/login', (req, res) => {
  const { nome, senha } = req.body;

  // Verificar se o usuário existe no banco de dados
  Usuario.findOne({ nome: nome }, (err, usuario) => {
    if (err) {
      console.error(err);
      res.status(500).send('Erro interno do servidor');
    } else if (!usuario) {
      res.status(401).send('Credenciais inválidas');
    } else {
      // Verificar se a senha é válida
      const senhaValida = bcrypt.compareSync(senha, usuario.senha);
      if (!senhaValida) {
        res.status(401).send('Credenciais inválidas');
      } else {
        // Gerar um token JWT
        const token = jwt.sign({ id: usuario._id, nome: usuario.nome }, 'chave-secreta-do-token', { expiresIn: '1h' });

        res.json({ token: token });
      }
    }
  });
});

// Middleware para verificar o token em rotas protegidas
function autenticacaoMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).send('Token não fornecido');
  } else {
    jwt.verify(token, 'chave-secreta-do-token', (err, decoded) => {
      if (err) {
        res.status(401).send('Token inválido');
      } else {
        req.usuario = decoded;
        next();
      }
    }
)}

};

