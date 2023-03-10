/* TODO:
 1. factor out common code in event listeners for better code reuse and maintainability
 2. move the green button under completed taks to the left to match with the design
*/

// My implementation of myFetch
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
      const liTemplate = `<li><span id="edit/${todo.id}">${todo.content}</span><button class="edit-btn" id="edit-btn/${todo.id}">edit</button><button class="delete-btn" id="delete-btn/${todo.id}">delete</button><button class="move-btn" id="move-btn/${todo.id}">move</button></li>`;
      todospendingTemplate += liTemplate;
    });
    todoscompleted.forEach((todo) => {
      const liTemplate = `<li><span>${todo.content}</span><button class="edit-btn" id="edit-btn/${todo.id}">edit</button><button class="delete-btn" id="delete-btn/${todo.id}">delete</button><button class="move-btn" id="move-btn/${todo.id}">move</button></li>`;
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
