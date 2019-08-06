(() => {

  const notesDb = {};

  function addNote(noteObj) {
    const noteEl = document
      .querySelector(".d-none.template .note")
      .cloneNode(true);
    noteEl.dataset.id = noteObj._id;
    noteEl.querySelector(".note-text").textContent = noteObj.note;
    const notesContainer = document.querySelector(".container .row");
    notesContainer.appendChild(noteEl);
    return noteEl;
  }

  function addNotes(notesObj) {
    notesObj.forEach(noteObj => {
      notesDb[noteObj._id] = noteObj.note;
      addNote(noteObj);
    });
  }

  function getAll() {
    fetch("/api/notes", {
      method: "GET",
      headers: {
        accept: "application/json"
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Unable to retrive the notes :(");
        }
        return res.json();
      })
      .then(notesObj => {
        addNotes(notesObj);
      })
      .catch(err => {
        console.error(err);
      });
  }

  function post(noteObj, callback) {
    fetch("/api/notes", {
      method: "POST",
      body: JSON.stringify(noteObj),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Unable to perform the action :(");
        }
        return res.json();
      })
      .then(noteObj => {
        callback(noteObj);
      })
      .catch(err => {
        console.error(err);
      });
  }

  function put(id, noteObj, callback) {
    fetch(`/api/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(noteObj),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Unable to perform the action :(");
        }
        return res.json();
      })
      .then(noteObj => {
        callback(noteObj);
      })
      .catch(err => {
        console.error(err);
      });
  }

  function del(id, callback) {
    fetch(`/api/notes/${id}`, {
      method: "DELETE",
      headers: {
        accept: "application/json"
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Unable to perform the action :(");
        }
        return res.json();
      })
      .then(noteObj => {
        callback(noteObj);
      })
      .catch(err => {
        console.error(err);
      });
  }

  getAll();

  document.addEventListener("focusout", e => {
    if (e.target.classList && e.target.classList.contains("note-text")) {
      const noteEl = e.target.closest(".note");
      const id = noteEl.dataset.id;
      const noteText = e.target.textContent;
      if (id && noteText === "") {
        del(id, () => {
          noteEl.remove();
          delete notesDb[id];
        });
      } else if (id && notesDb[id] !== noteText) {
        put(id, {note: noteText}, noteObj => {
          notesDb[id] = noteObj.note;
        });
      } else if (!id) {
        post({note: noteText}, noteObj => {
          notesDb[noteObj._id] = noteObj.note;
          noteEl.dataset.id = noteObj._id;
        });
      }
    }
  });

  document.addEventListener("click", e => {
    if (e.target.classList.contains("fa-trash-o")) {
      const noteEl = e.target.closest(".note");
      const id = noteEl.dataset.id;
      if (id) {
        del(id, () => {
          noteEl.remove();
          delete notesDb[id];
        });
      } else {
        noteEl.remove();
      }
    }
  });

  const addButton = document.querySelector(".btn.btn-primary");
  addButton.addEventListener("click", e => {
    e.preventDefault();
    addNote({
      _id: "",
      note: ""
    });
  });
})();
