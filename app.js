const express = require("express");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;

const NOTES_COLLECTION = "notes";

const app = express();
app.use(bodyParser.json());

// Static file server
const staticDir = __dirname + "/static/";
app.use(express.static(staticDir));

let db;

// Connect to the database and if successful start the server.
mongodb.MongoClient.connect(
  process.env.MONGODB_URI || "mongodb://mongo:27017/notes_db"
)
  .then(client => {
    db = client.db();
    console.info("Database connection ready");
    const server = app.listen(process.env.PORT || 8080, () => {
      const port = server.address().port;
      console.info("App now running on port", port);
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

// Error handler.
function handleError(res, reason, message, code) {
  console.error("ERROR: " + reason);
  res.status(code || 500).json({
    error: message
  });
}

// GET: list all notes
app.get("/api/notes", (_, res) => {
  db.collection(NOTES_COLLECTION)
    .find({})
    .toArray()
    .then(docs => {
      res.status(200).json(docs);
    })
    .catch(err => {
      handleError(res, err.message, "Failed to get notes.");
    });
});

// POST: create a new note
app.post("/api/notes", (req, res) => {
  const newNote = req.body;

  if (!newNote.note) {
    handleError(res, "Invalid user input", "Must provide a note.", 400);
    return;
  }

  newNote.createDate = new Date();
  delete newNote._id;

  db.collection(NOTES_COLLECTION)
    .insertOne(newNote)
    .then(result => {
      res.status(201).json(result.ops[0]);
    })
    .catch(err => {
      handleError(res, err.message, "Failed to create new note.");
    });
});

// GET: find note by id
app.get("/api/notes/:id", (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    handleError(res, "Invalid id", "Must provide a valid id.", 400);
    return;
  }

  db.collection(NOTES_COLLECTION)
    .findOne({
      _id: new ObjectID(id)
    })
    .then(doc => {
      if (!doc) {
        handleError(res, "Id does not exist", "Not found :(", 404);
        return;
      }
      res.status(200).json(doc);
    })
    .catch(err => {
      handleError(res, err.message, "Failed to get note");
    });
});

// PUT: update note by id
app.put("/api/notes/:id", (req, res) => {
  let id = req.params.id;

  if (!ObjectID.isValid(id)) {
    handleError(res, "Invalid id", "Must provide a valid id.", 400);
    return;
  }

  const updateDoc = req.body;

  if (!updateDoc.note) {
    handleError(res, "Invalid user input", "Must provide a note.", 400);
    return;
  }

  updateDoc.modifyDate = new Date();
  delete updateDoc._id;

  db.collection(NOTES_COLLECTION)
    .findOneAndUpdate(
      {
        _id: new ObjectID(id)
      },
      {
        $set: updateDoc
      },
      {
        returnOriginal: false
      }
    )
    .then(result => {
      res.status(200).json(result.value);
    })
    .catch(err => {
      handleError(res, err.message, "Failed to update note");
    });
});

// DELETE: deletes note by id
app.delete("/api/notes/:id", (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    handleError(res, "Invalid id", "Must provide a valid id.", 400);
    return;
  }

  db.collection(NOTES_COLLECTION)
    .findOneAndDelete({
      _id: new ObjectID(id)
    })
    .then(result => {
      res.status(200).json(result.value);
    })
    .catch(err => {
      handleError(res, err.message, "Failed to delete note");
    });
});
