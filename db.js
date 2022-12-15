const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;

const state = {
  client: null,
  db: null,
};

async function connect(callback) {
  try {
    state.client = new MongoClient(uri);
    await state.client.connect();
    state.db = state.client.db('whiteboard');
    callback();
  } catch (err) {
    if (err) return callback(err);
  }
}

function get() {
  return state.db;
}

function getStrokes(callback) {
  const strokeColl = state.db.collection('stroke');
  strokeColl.find().toArray((err, docs) => {
    callback(err, docs);
  });
}

function getChats(callback) {
  const chatColl = state.db.collection('chat');
  chatColl.find().sort({ date: 1 }).toArray((err, docs) => {
    callback(err, docs);
  });
}

function addStroke(obj) {
  const strokeColl = state.db.collection('stroke');
  strokeColl.insertOne(obj, (err) => {
    if (err) throw err;
  });
}

function addChat(obj) {
  const chatColl = state.db.collection('chat');
  chatColl.insertOne(obj, (err) => {
    if (err) throw err;
  });
}

function clearStrokes() {
  const strokeColl = state.db.collection('stroke');
  strokeColl.deleteMany({});
}

async function close(callback) {
  await state.client.close();
}

module.exports = {
  connect,
  get,
  getStrokes,
  getChats,
  addStroke,
  addChat,
  clearStrokes,
  close,
};