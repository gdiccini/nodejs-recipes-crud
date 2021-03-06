const chai = require("chai");
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { MongoClient } = require('mongodb');

chai.use(chaiHttp);

const server = require('../api/app');
const { getConnection } = require('./connectionMock');

const { expect } = chai;

describe('POST /users', () => {
  let response;
  describe('quando o campo name está vazio', () => {
    before(async () => {
      response = await chai.request(server)
        .post('/users')
        .send({ email: 'email@email.com', password: "senha"})
    });

    it('retorna status 400', () => {
      expect(response).to.have.status(400);
    });

    it('retorna mensagem "Invalid entries. Try again."', () => {
      expect(response.body.message).to.be.equal('Invalid entries. Try again.');
    });
  });

  describe('quando o campo email está vazio', () => {
    before(async () => {
      response = await chai.request(server)
        .post('/users')
        .send({ name: 'name', password: "senha"})
    });

    it('retorna status 400', () => {
      expect(response).to.have.status(400);
    });

    it('retorna mensagem "Invalid entries. Try again."', () => {
      expect(response.body.message).to.be.equal('Invalid entries. Try again.');
    });
  });

  describe('quando o campo email é inválido', () => {

    before(async () => {
      response = await chai.request(server)
        .post('/users')
        .send({ name: 'name', email: 'email@email', password: "senha"})
    });

    it('retorna status 400', () => {
      expect(response).to.have.status(400);
    });

    it('retorna mensagem "Invalid entries. Try again."', () => {
      expect(response.body.message).to.be.equal('Invalid entries. Try again.');
    });
  });

  describe('quando o email ja existe', () => {
    let connectionMock;

    before(async () => {
      connectionMock = await getConnection();
      sinon.stub(MongoClient, 'connect').resolves(connectionMock);

      await chai.request(server)
        .post('/users')
        .send({ name: 'name', email: 'email@email.com', password: "senha"});

      response = await chai.request(server)
        .post('/users')
        .send({ name: 'name', email: 'email@email.com', password: "senha"});
    });

    after(async () => {
      MongoClient.connect.restore();
    });

    it('retorna status 409', () => {
      expect(response).to.have.status(409);
    });

    it('retorna mensagem "Email already registered"', () => {
      expect(response.body.message).to.be.equal('Email already registered');
    });
  });

  describe('quando o campo password está vazio', () => {
    before(async () => {
      response = await chai.request(server)
        .post('/users')
        .send({ name: 'name', email: 'email@email.com' })
    });

    it('retorna status 400', () => {
      expect(response).to.have.status(400);
    });

    it('retorna mensagem "Invalid entries. Try again."', () => {
      expect(response.body.message).to.be.equal('Invalid entries. Try again.');
    });
  });

  describe('Cria-se um usuário com sucesso', () => {
    let connectionMock;
    before(async () => {
      connectionMock = await getConnection();
      sinon.stub(MongoClient, 'connect').resolves(connectionMock);

      response = await chai.request(server)
        .post('/users')
        .send({ name: 'name', email: 'novono@email.com', password: '1234567' });
    });

    after(async () => {
      MongoClient.connect.restore();
      await connectionMock.db('Cookmaster').collection('users').drop();
    });

    it('retorna status 201', () => {
      expect(response).to.have.status(201);
    });

    it('retorna um objeto com as chaves "name", "email" e "role"', () => {
      expect(response.body.user).to.have.keys('_id', 'name', 'email', 'role');
    });
  });
});