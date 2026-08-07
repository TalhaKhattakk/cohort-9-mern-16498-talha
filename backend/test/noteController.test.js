const { expect } = require('chai');
const sinon = require('sinon');
const Note = require('../models/Note');
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');

const mockRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Note Controller', () => {
  afterEach(() => sinon.restore());

  describe('getNotes', () => {
    it('returns notes belonging to the logged in user, newest first', async () => {
      const fakeNotes = [{ title: 'Test', content: 'Content' }];
      const sortStub = sinon.stub().resolves(fakeNotes);
      sinon.stub(Note, 'find').returns({ sort: sortStub });

      const req = { user: { id: 'user123' } };
      const res = mockRes();

      await getNotes(req, res, sinon.stub());

      expect(Note.find.calledWith({ userId: 'user123' })).to.be.true;
      expect(sortStub.calledWith({ createdAt: -1 })).to.be.true;
      expect(res.json.calledWith(fakeNotes)).to.be.true;
    });
  });

  describe('createNote', () => {
    it('forwards a 400 error when title or content is missing', async () => {
      const req = { body: { title: '' }, user: { id: 'user123' } };
      const res = mockRes();
      const next = sinon.stub();

      await createNote(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].statusCode).to.equal(400);
    });

    it('creates and returns the new note', async () => {
      const req = { body: { title: 'Hi', content: 'World' }, user: { id: 'user123' } };
      const res = mockRes();
      const saveStub = sinon.stub(Note.prototype, 'save').resolves({
        _id: 'note1',
        title: 'Hi',
        content: 'World',
        userId: 'user123'
      });

      await createNote(req, res, sinon.stub());

      expect(saveStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
    });
  });

  describe('updateNote', () => {
    it('forwards a 404 error when the note does not exist', async () => {
      sinon.stub(Note, 'findOne').resolves(null);
      const req = { params: { id: 'abc' }, body: { title: 'x' }, user: { id: 'user123' } };
      const res = mockRes();
      const next = sinon.stub();

      await updateNote(req, res, next);

      expect(next.firstCall.args[0].statusCode).to.equal(404);
    });

    it('updates and returns the note when found', async () => {
      const existingNote = {
        title: 'Old',
        content: 'Old content',
        save: async function () {
          return this;
        }
      };
      sinon.stub(Note, 'findOne').resolves(existingNote);

      const req = {
        params: { id: 'note1' },
        body: { title: 'New title' },
        user: { id: 'user123' }
      };
      const res = mockRes();

      await updateNote(req, res, sinon.stub());

      expect(existingNote.title).to.equal('New title');
      expect(res.json.calledOnce).to.be.true;
    });
  });

  describe('deleteNote', () => {
    it('forwards a 404 error when the note does not exist', async () => {
      sinon.stub(Note, 'findOneAndDelete').resolves(null);
      const req = { params: { id: 'abc' }, user: { id: 'user123' } };
      const res = mockRes();
      const next = sinon.stub();

      await deleteNote(req, res, next);

      expect(next.firstCall.args[0].statusCode).to.equal(404);
    });

    it('deletes the note and confirms deletion', async () => {
      sinon.stub(Note, 'findOneAndDelete').resolves({ _id: 'note1' });
      const req = { params: { id: 'note1' }, user: { id: 'user123' } };
      const res = mockRes();

      await deleteNote(req, res, sinon.stub());

      expect(res.json.calledWithMatch({ id: 'note1' })).to.be.true;
    });
  });
});
