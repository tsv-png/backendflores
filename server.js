const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(
  "mongodb+srv://thais:OsBrlxCRWKXAk8mF@cluster0.4mnwtae.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);
const db = mongoose.connection;
db.on(
  "error",
  console.error.bind(console, "Erro de conexão com o banco de dados:")
);
db.once("open", function () {
  console.log("Conectado ao banco de dados.");
});

const UsuarioSchema = new mongoose.Schema({
  nome: String,
  senha: String,
});

const Usuario = mongoose.model("Usuario", UsuarioSchema);

app.post("/registro", async (req, res) => {
  const { nome, senha } = req.body;

  const usuarioExistente = await Usuario.findOne({ nome: nome });
  if (usuarioExistente) {
    res.status(400).send("Usuário já registrado");
  } else {
    const senhaCriptografada = bcrypt.hashSync(senha, 10);

    const usuario = new Usuario({
      nome: nome,
      senha: senhaCriptografada,
    });
    const user = usuario.save();
    if (user) {
      res.send("Usuário registrado com sucesso");
    } else {
      res.status(500).send("Erro interno do servidor");
    }
  }
});

// Rota de login
app.post("/login", async (req, res) => {
  const { nome, senha } = req.body;

  // Verificar se o usuário existe no banco de dados
  const usuario = await Usuario.findOne({ nome });
  if (!usuario) {
    res.status(401).send("Credenciais inválidas");
  } else {
    // Verificar se a senha é válida
    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaValida) {
      res.status(401).send("Credenciais inválidas");
    } else {
      // Gerar um token JWT
      const token = jwt.sign(
        { id: usuario._id, nome: usuario.nome, isAdmin: usuario?.isAdmin },
        "change-of-mind",
        { expiresIn: "1h" }
      );

      res.json({ token: token });
    }
  }
});

app.delete("/usuario/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await Usuario.findByIdAndDelete(id);
    res.send("Usuário excluído com sucesso");
  } catch (error) {
    res.status(500).send("Erro interno do servidor");
  }
});

app.put("/usuario/:id", async (req, res) => {
  const id = req.params.id;
  const { nome, senha } = req.body;

  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      res.status(404).send("Usuário não encontrado");
    } else {
      const senhaCriptografada = bcrypt.hashSync(senha, 10);

      usuario.nome = nome;
      usuario.senha = senhaCriptografada;

      await usuario.save();
      res.send("Usuário atualizado com sucesso");
    }
  } catch (error) {
    res.status(500).send("Erro interno do servidor");
  }
});

app.listen("3004", () => {
  console.log("Servidor iniciado na porta 3004");
});