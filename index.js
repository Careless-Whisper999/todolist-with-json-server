/* TODO:
 1. factor out common code in event listeners for better code reuse and maintainability
 2. move the green button under completed tasks to the left to match with the design
*/

// My implementation of fetch
function myFetch(url, options = {}) {
  return new Promise((res, rej) => {
    let xhr = new XMLHttpRequest();
    xhr.open(options.method || "GET", url);
    xhr.responseType = "json";
    for (let headerName in options.headers) {
      xhr.setRequestHeader(headerName, options.headers[headerName]);
    }
    xhr.onload = () => {
      res(xhr.response);
    };
    xhr.onerror = () => {
      rej(new Error("myFetch failed"));
    };
    xhr.send(options.body);
  });
}

// APIs
const APIs = (() => {
  const createTodo = (newTodo) => {
    return myFetch("http://localhost:3000/todos", {
      method: "POST",
      body: JSON.stringify(newTodo),
      headers: { "Content-Type": "application/json" },
    });
  };

  const updateTodo = (id, newTodo) => {
    return myFetch("http://localhost:3000/todos/" + id, {
      method: "PATCH",
      body: JSON.stringify(newTodo),
      headers: { "Content-Type": "application/json" },
    });
  };

  const deleteTodo = (id) => {
    return myFetch("http://localhost:3000/todos/" + id, {
      method: "DELETE",
    });
  };

  const getTodos = () => {
    return myFetch("http://localhost:3000/todos");
  };
  return { createTodo, updateTodo, deleteTodo, getTodos };
})();

// model
const Model = (() => {
  class State {
    #todos; //private field
    #onChange; //function, will be called when setter function todos is called
    constructor() {
      this.#todos = [];
    }
    get todos() {
      return this.#todos;
    }
    set todos(newTodos) {
      // reassign value
      console.log("setter function");
      this.#todos = newTodos;
      this.#onChange?.(); // rendering
    }

    subscribe(callback) {
      //subscribe to the change of the state todos
      this.#onChange = callback;
    }
  }
  const { getTodos, createTodo, deleteTodo, updateTodo } = APIs;
  return {
    State,
    getTodos,
    createTodo,
    deleteTodo,
    updateTodo,
  };
})();

// view
const View = (() => {
  const todolistpendingEl = document.querySelector(".todo-list--pending");
  const todolistcompletedEl = document.querySelector(".todo-list--completed");
  const submitBtnEl = document.querySelector(".submit-btn");
  const inputEl = document.querySelector(".input");

  const renderTodos = (todos) => {
    let todospendingTemplate = "";
    let todoscompletedTemplate = "";
    const todospending = todos.filter((todo) => {
      return !todo.completed;
    });
    const todoscompleted = todos.filter((todo) => {
      return todo.completed;
    });
    todospending.forEach((todo) => {
      const liTemplate = `<li><span id="edit/${todo.id}">${todo.content}</span><button class="edit-btn" id="edit-btn/${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"  aria-label="fontSize small"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button><button class="delete-btn" id="delete-btn/${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button><button class="move-btn" id="move-btn/${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowForwardIcon" aria-label="fontSize small"><path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg></button></li>`;
      todospendingTemplate += liTemplate;
    });
    todoscompleted.forEach((todo) => {
      const liTemplate = `<li><span>${todo.content}</span><button class="edit-btn" id="edit-btn/${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"  aria-label="fontSize small"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button><button class="delete-btn" id="delete-btn/${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button><button class="move-btn" id="move-btn/${todo.id}"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg></button></li>`;
      todoscompletedTemplate += liTemplate;
    });

    if (todospending.length === 0) {
      todospendingTemplate = "<h4>no task to display!</h4>";
    }
    if (todoscompleted.length === 0) {
      todoscompletedTemplate = "<h4>no task to display!</h4>";
    }
    todolistpendingEl.innerHTML = todospendingTemplate;
    todolistcompletedEl.innerHTML = todoscompletedTemplate;
  };

  const clearInput = () => {
    inputEl.value = "";
  };

  return {
    renderTodos,
    submitBtnEl,
    inputEl,
    clearInput,
    todolistpendingEl,
    todolistcompletedEl,
  };
})();

// controller
const Controller = ((view, model) => {
  const state = new model.State();
  const init = () => {
    model.getTodos().then((todos) => {
      todos.reverse();
      state.todos = todos;
    });
  };

  const handleSubmit = () => {
    view.submitBtnEl.addEventListener("click", (event) => {
      const inputValue = view.inputEl.value;
      model
        .createTodo({ content: inputValue, completed: false })
        .then((data) => {
          state.todos = [data, ...state.todos];
          view.clearInput();
        });
    });
  };

  const handleDelete = () => {
    view.todolistpendingEl.addEventListener("click", (event) => {
      if (event.target.className === "delete-btn") {
        const id = event.target.id.split("/")[1];
        model.deleteTodo(+id).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== +id);
        });
      }
    });

    view.todolistcompletedEl.addEventListener("click", (event) => {
      if (event.target.className === "delete-btn") {
        const id = event.target.id.split("/")[1];
        model.deleteTodo(+id).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== +id);
        });
      }
    });
  };

  const handleMove = () => {
    view.todolistpendingEl.addEventListener("click", (event) => {
      if (event.target.className === "move-btn") {
        const id = event.target.id.split("/")[1];
        model.updateTodo(+id, { completed: true }).then(() => {
          state.todos.forEach((todo) => {
            if (+todo.id === +id) {
              todo.completed = true;
            }
          });
          state.todos = [...state.todos];
        });
      }
    });
    view.todolistcompletedEl.addEventListener("click", (event) => {
      if (event.target.className === "move-btn") {
        const id = event.target.id.split("/")[1];
        model.updateTodo(+id, { completed: false }).then(() => {
          state.todos.forEach((todo) => {
            if (+todo.id === +id) {
              todo.completed = false;
            }
          });
          state.todos = [...state.todos];
        });
      }
    });
  };

  const handleEdit = () => {
    view.todolistpendingEl.addEventListener("click", (event) => {
      if (event.target.className === "edit-btn") {
        const id = event.target.id.split("/")[1];
        const spanEl = event.target.parentElement.firstChild;
        if (spanEl.contentEditable === "true") {
          model.updateTodo(+id, { content: spanEl.innerHTML }).then(() => {
            spanEl.contentEditable = "false";
            spanEl.style.backgroundColor = "#e6e2d3";
          });
        } else {
          spanEl.contentEditable = "true";
          spanEl.style.backgroundColor = "white";
        }
      }
    });
    view.todolistcompletedEl.addEventListener("click", (event) => {
      if (event.target.className === "edit-btn") {
        const id = event.target.id.split("/")[1];
        const spanEl = event.target.parentElement.firstChild;
        if (spanEl.contentEditable === "true") {
          model.updateTodo(+id, { content: spanEl.innerHTML }).then(() => {
            spanEl.contentEditable = "false";
            spanEl.style.backgroundColor = "#e6e2d3";
          });
        } else {
          spanEl.contentEditable = "true";
          spanEl.style.backgroundColor = "white";
        }
      }
    });
  };

  const bootstrap = () => {
    init();
    handleSubmit();
    handleDelete();
    handleMove();
    handleEdit();
    state.subscribe(() => {
      view.renderTodos(state.todos);
    });
  };
  return {
    bootstrap,
  };
})(View, Model);

Controller.bootstrap();
