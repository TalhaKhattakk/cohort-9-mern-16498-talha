const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// used to get all notes
const getNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
  logger.info({ userId: req.user.id, count: notes.length }, 'Fetched notes');
  res.json(notes);
});

// used to create a new note for a user
const createNote = asyncHandler(async (req, res, next) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return next(new AppError('Title and content are required', 400));
  }

  const newNote = new Note({
    title,
    content,
    userId: req.user.id
  });
  const savedNote = await newNote.save();
  logger.info({ userId: req.user.id, noteId: savedNote._id }, 'Note created');
  res.status(201).json(savedNote);
});

// to update a note
const updateNote = asyncHandler(async (req, res, next) => {
  const existingNote = await Note.findOne({ _id: req.params.id, userId: req.user.id });
  if (!existingNote) {
    return next(new AppError('Note not found', 404));
  }

  const { title, content } = req.body;
  if (title !== undefined) existingNote.title = title;
  if (content !== undefined) existingNote.content = content;

  const updatedNote = await existingNote.save();
  logger.info({ userId: req.user.id, noteId: updatedNote._id }, 'Note updated');
  res.json(updatedNote);
});

// to delete a note
const deleteNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!note) {
    return next(new AppError('Note not found', 404));
  }
  logger.info({ userId: req.user.id, noteId: req.params.id }, 'Note deleted');
  res.json({ message: 'Note deleted successfully', id: req.params.id });
});

module.exports = { getNotes, createNote, updateNote, deleteNote };
