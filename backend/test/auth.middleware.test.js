  const { expect } = require('chai');
  const sinon = require('sinon');
  const jwt = require('jsonwebtoken');
  const auth = require('../middleware/auth');

  describe('Auth Middleware', () => {
    afterEach(() => sinon.restore());

    it('calls next with a 401 error when no token is provided', () => {
      const req = { headers: {} };
      const res = {};
      const next = sinon.stub();

      auth(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].statusCode).to.equal(401);
    });

    it('calls next with a 401 error when header does not start with "Bearer "', () => {
      const req = { headers: { authorization: 'Token abc123' } };
      const res = {};
      const next = sinon.stub();

      auth(req, res, next);

      expect(next.firstCall.args[0].statusCode).to.equal(401);
    });

    it('attaches the decoded user to req and calls next() on a valid token', () => {
      sinon.stub(jwt, 'verify').returns({ id: 'user1', email: 'a@test.com' });
      const req = { headers: { authorization: 'Bearer validtoken' } };
      const res = {};
      const next = sinon.stub();

      auth(req, res, next);

      expect(req.user).to.deep.equal({ id: 'user1', email: 'a@test.com' });
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args).to.have.lengthOf(0); // called with no error
    });

    it('calls next with a 401 error on an invalid/expired token', () => {
      sinon.stub(jwt, 'verify').throws(new Error('jwt malformed'));
      const req = { headers: { authorization: 'Bearer badtoken' } };
      const res = {};
      const next = sinon.stub();

      auth(req, res, next);

      expect(next.firstCall.args[0].statusCode).to.equal(401);
    });
  });
