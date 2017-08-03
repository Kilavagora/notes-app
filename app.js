let express = require("express");
let bodyParser = require("body-parser");
let mongodb = require("mongodb");
let ObjectID = mongodb.ObjectID;

const NOTES_COLLECTION = "notes";

let app = express();
app.use(bodyParser.json());

// Static file server
let staticDir = __dirname + "/static/";
app.use(express.static(staticDir));

let db;

// Connect to the database and if successful start the server.
mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://mongo:27017/notes_db")
  .then((database) => {
    db = database;
    console.log("Database connection ready");
    let server = app.listen(process.env.PORT || 8080, () => {
      let port = server.address().port;
      console.log("App now running on port", port);
    });
  }).catch((err) => {
    console.log(err);
    process.exit(1);
  });

// Error handler.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({
    "error": message
  });
}

// GET: list all notes
app.get("/api/notes", (req, res) => {
  db.collection(NOTES_COLLECTION).find({}).toArray()
    .then((docs) => {
      res.status(200).json(docs);
    })
    .catch((err) => {
      handleError(res, err.message, "Failed to get notes.");
    });
});

// POST: create a new note
app.post("/api/notes", (req, res) => {
  let newnote = req.body;
  newnote.createDate = new Date();

  if (!req.body.note) {
    handleError(res, "Invalid user input", "Must provide a note.", 400);
  }

  db.collection(NOTES_COLLECTION).insertOne(newnote)
    .then((doc) => {
      res.status(201).json(doc.ops[0]);
    })
    .catch((err) => {
      handleError(res, err.message, "Failed to create new note.");
    });

});

// GET: find note by id
app.get("/api/notes/:id", (req, res) => {

  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    handleError(res, "Invalid id", "Must provide a valid id.", 400);
  }

  db.collection(NOTES_COLLECTION).findOne({
      _id: new ObjectID(id)
    })
    .then((doc) => {
      if (!doc) {
        handleError(res, "Id does not exist", "Not found :(", 404);
        return;
      }
      res.status(200).json(doc);
    })
    .catch((err) => {
      handleError(res, err.message, "Failed to get note");
    });
});

// PUT: update note by id
app.put("/api/notes/:id", (req, res) => {

  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    handleError(res, "Invalid id", "Must provide a valid id.", 400);
  }

  let updateDoc = req.body;
  delete updateDoc._id;

  db.collection(NOTES_COLLECTION).updateOne({
      _id: new ObjectID(id)
    }, updateDoc)
    .then((doc) => {
      updateDoc._id = req.params.id;
      res.status(200).json(updateDoc);
    })
    .catch((err) => {
      handleError(res, err.message, "Failed to update note");
    });
});

// DELETE: deletes note by id
app.delete("/api/notes/:id", (req, res) => {

  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    handleError(res, "Invalid id", "Must provide a valid id.", 400);
  }

  db.collection(NOTES_COLLECTION).deleteOne({
    _id: new ObjectID(id)
  }).then((result) => {
    res.status(200).json({
      id: req.params.id,
      result: result
    });
  }).catch((err) => {
    handleError(res, err.message, "Failed to delete note");
  });
});