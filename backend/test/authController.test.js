const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signup, login } = require('../controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Auth Controller', () => {
  afterEach(() => sinon.restore());

  describe('signup', () => {
    it('forwards a 400 error when password is shorter than 8 characters', async () => {
      const req = { body: { email: 'a@test.com', password: '123' } };
      const res = mockRes();
      const next = sinon.stub();

      await signup(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].statusCode).to.equal(400);
    });

    it('forwards a 400 error when the user already exists', async () => {
      sinon.stub(User, 'findOne').resolves({ email: 'a@test.com' });
      const req = { body: { email: 'a@test.com', password: '123456!A' } };
      const res = mockRes();
      const next = sinon.stub();

      await signup(req, res, next);

      expect(next.firstCall.args[0].statusCode).to.equal(400);
    });

    it('creates a user and returns a token on success', async () => {
      sinon.stub(User, 'findOne').resolves(null);
      sinon.stub(bcrypt, 'genSalt').resolves('salt');
      sinon.stub(bcrypt, 'hash').resolves('hashedpw');
      sinon.stub(User.prototype, 'save').resolves({
        _id: 'user1',
        name: '',
        email: 'a@test.com'
      });
      sinon.stub(jwt, 'sign').returns('faketoken');

      const req = { body: { email: 'a@test.com', password: '123456!A' } };
      const res = mockRes();

      await signup(req, res, sinon.stub());

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWithMatch({ token: 'faketoken' })).to.be.true;
    });
  });

  describe('login', () => {
    it('forwards a 400 error when the user does not exist', async () => {
      sinon.stub(User, 'findOne').resolves(null);
      const req = { body: { email: 'a@test.com', password: '123456' } };
      const res = mockRes();
      const next = sinon.stub();

      await login(req, res, next);

      expect(next.firstCall.args[0].statusCode).to.equal(400);
    });

    it('forwards a 400 error when the password does not match', async () => {
      sinon.stub(User, 'findOne').resolves({ _id: 'u1', password: 'hashed' });
      sinon.stub(bcrypt, 'compare').resolves(false);
      const req = { body: { email: 'a@test.com', password: 'wrongpw' } };
      const res = mockRes();
      const next = sinon.stub();

      await login(req, res, next);

      expect(next.firstCall.args[0].statusCode).to.equal(400);
    });

    it('logs the user in and returns a token on success', async () => {
      sinon.stub(User, 'findOne').resolves({
        _id: 'u1',
        email: 'a@test.com',
        name: 'A',
        password: 'hashed'
      });
      sinon.stub(bcrypt, 'compare').resolves(true);
      sinon.stub(jwt, 'sign').returns('faketoken');

      const req = { body: { email: 'a@test.com', password: '123456' } };
      const res = mockRes();

      await login(req, res, sinon.stub());

      expect(res.json.calledWithMatch({ token: 'faketoken' })).to.be.true;
    });
  });
});