import { fetchTask } from "./task-info-container.js";
import { fetchLists } from "./lists.js"
import { fetchComments, postComment } from "./comments.js";


// Error handler
export const handleErrors = async (err) => {
  if (err.status >= 400 && err.status < 600) {
    const errorJSON = await err.json();
    const errorsContainer = document.querySelector(".errors-container");
    let errorsHtml = [
      `
          <div class="alert alert-danger">
              Something went wrong. Please try again.
          </div>
        `,
    ];
    const { errors } = errorJSON;
    if (errors && Array.isArray(errors)) {
      errorsHtml = errors.map(
        (message) => `
            <div class="alert alert-danger">
                ${message}
            </div>
          `
      );
    }
    errorsContainer.innerHTML = errorsHtml.join("");
  } else {
    alert(
      "Something went wrong. Please check your internet connection and try again!"
    );
  }
};

// Parse csrf token
export const cookieMonster = (token) => {
  const cookie = token.split(";")
  const cookies = cookie.filter(ele => {
    if (ele.includes("XSRF-TOKEN")) return ele
  })
  const edibleCookie = cookies.map(ele => ele.split("=")).flat();
  return edibleCookie[1];
}

// This function checks the dueDate selected for the task
// If the task is due today or tomorrow, it is indicated and also has the time
// If the task is due in the past, it changes it to "OVERDUE" with the date&time it was due
// Otherwise, it writes the due date as a date in a format like 'Oct 31 01:16'.
export const dueDateFormatter = (task) => {

  let today = new Date();
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1)

  let ddToday = String(today.getDate()).padStart(2, '0');
  let mmToday = String(today.getMonth() + 1).padStart(2, '0');
  let yyyyToday = today.getFullYear();

  let ddTom = String(tomorrow.getDate()).padStart(2, '0');
  let mmTom = String(tomorrow.getMonth() + 1).padStart(2, '0');
  let yyyyTom = tomorrow.getFullYear();

  today = yyyyToday + '-' + mmToday + '-' + ddToday;
  tomorrow = yyyyTom + '-' + mmTom + '-' + ddTom;

  let selectedDate = task.dueDate;
  selectedDate = new Date(selectedDate);
  let diff = (new Date().getTime()) - selectedDate.getTime();

  let selectedDateTime = selectedDate.getTime();
  let actualDateTime = new Date(selectedDateTime)
  actualDateTime = new Date(actualDateTime.getTime() + (8 * 60 * 60 * 1000))

  let ddactualDate = String(actualDateTime.getDate()).padStart(2, '0');
  let mmactualDate = String(actualDateTime.getMonth() + 1).padStart(2, '0');
  let yyyyactualDate = actualDateTime.getFullYear()

  let actualDate = yyyyactualDate + '-' + mmactualDate + '-' + ddactualDate;

  let due = actualDate;

  if (diff > 0) {
    return due = `OVERDUE`
  }

  if (due === today) {
    return due = `Today ${getTime(task.dueDate)}`;
  }

  if (due === tomorrow) {
    return due = `Tomorrow ${getTime(task.dueDate)}`;
  }


  return dateFormatter(task.dueDate);
}

export const dueDateToYYYMMDD = (date) => {
  let selectedDate = date;
  selectedDate = new Date(selectedDate);
  let selectedDateTime = selectedDate.getTime();
  let actualDateTime = new Date(selectedDateTime + (8 * 60 * 60 * 1000))

  let ddactualDate = String(actualDateTime.getDate()).padStart(2, '0');
  let mmactualDate = String(actualDateTime.getMonth() + 1).padStart(2, '0');
  let yyyyactualDate = actualDateTime.getFullYear()

  let actualDate = yyyyactualDate + '-' + mmactualDate + '-' + ddactualDate + 'T' + getTime(actualDateTime);
  return actualDate;
}

// Returns just the time given a date with a time
const getTime = (dueDate) => {
  return dateFormatter(dueDate).slice(7);
}

// Formats the date and time of a comment to a nice format, e.g. 'Oct 31 01:16'
export const dateFormatter = (date) => {
  let actualDate = new Date(date);
  let actualDateTime = new Date(actualDate.getTime() + (8 * 60 * 60 * 1000))
  return `${actualDateTime.toDateString().slice(4,10)} ${actualDateTime.toString().slice(16,21)}`
}


// Adds all of the event listeners back to each task in the current list of taskscontainer.
// Should be called any time the list of tasks is updated (e.g. when a task is added,
// edited, deleted; when the list selected changes, when the list is edited).
export const addTaskInfoListeners = async () => {

  const taskInfoContainer = document.querySelectorAll('.task-info');

  taskInfoContainer.forEach((task) => {
    task.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taskId = task.id;

      const editForm = document.querySelector('.edit-form');
      editForm.hidden = true;
      editForm.style.display = 'none';
      const taskInfo = document.querySelector('.fiona');
      taskInfo.classList.remove('task-information-animation')


      try {

        await fetchTask(taskId);

        if (taskInfo.classList.contains('task-information-animation') && e.target.id !== taskId) {
          taskInfo.classList.remove('task-information-animation');
        } else {
          taskInfo.hidden = false;
          setTimeout(() => {
            taskInfo.classList.add('task-information-animation');

          }, 0);

        }

        const createComment = document.querySelector('.create-comment');

        createComment.addEventListener('submit', async (event) => {
          event.stopPropagation();
          event.preventDefault();
          const commentData = new FormData(createComment);
          const message = commentData.get("message");
          const taskId = commentData.get("taskId");

          const body = { message };

          postComment(taskId, body);

        })

      } catch (e) {
        console.error(e);
      }

      try {
        await fetchComments(taskId);
      } catch (e) {
        console.error(e);
      }

    })
  })


}


// Adds event listener to the edit list button when a specific list is selected.
// Should be called when switching between lists.
export const editListEventListener = async () => {
  const editListTitle = document.querySelector(".edit-list-button");
  editListTitle.addEventListener('click', async (e) => {
    let listId = e.target.id;

    const listToUpdate = await fetch(`/lists/${listId}`);

    const { listName } = await listToUpdate.json();

    const listForm = document.querySelector('.updateList');
    listForm.innerHTML = `
          <div class="cloud"></div>
          <div class="edit-list-pop">
            <h2 class="modal-header">Edit List Name</h2>
            <div id='list-edit'>
              <form class='list-edit-form modal-form'>
              <label for='title' class='list-label'${listName.title} </label>
              <div class="add-list-buttons-container">
              <input type='text' class='list-edit modal-input list-modal-input' id='title' name='title' placeholder=${listName.title}>

              <button class='submitButton button-modal' id='${listId}'>Submit</button>

              <button class='editCancelButton button-modal' id='${listId}'>Cancel</button>
              </div>
              </form>
            </div>
            </div>
          `

    const listUpdate = document.querySelector('.list-edit-form')
    listUpdate.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const formData = new FormData(listUpdate);
      const title = formData.get('title')
      const body = { title }
      const token = cookieMonster(document.cookie)
      const updatedList = await fetch(`/lists/${listId}`, {
        method: 'PATCH',
        credentials: "same-origin",
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          "CSRF-Token": token
        }
      })

      const { list } = await updatedList.json();

      const listHeader = document.querySelector('.task-list-header');
      listHeader.innerText = list.title;

      listForm.innerHTML = '';
      await fetchLists();
    })


    const cancelButton = document.querySelector('.editCancelButton');
    cancelButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      listForm.innerHTML = '';
    })
  })
}



// Updates the value for "Overdue" found in the upper right corner.
// Should be called whenever a task is added, edited, or deleted.
// Called in fetchTasks() because we do that every time
export const updateOverDueValue = async () => {
  const overDueValue = document.querySelector('#tasksOverdueValue');
  const overDueRes = await fetch('/lists/overdue');
  const { tasks } = await overDueRes.json();

  let numOverdueTasks;
  let numOverdueGivenToMe;
  if (tasks) {
    numOverdueTasks = tasks.length;
  } else {
    numOverdueTasks = 0;
  }


  const overDueGivenRes = await fetch('/lists/overdue/given-to-me');
  const { overdueGivenToMe } = await overDueGivenRes.json();
  if (overdueGivenToMe) {
    numOverdueGivenToMe = overdueGivenToMe.length;
  } else {
    numOverdueGivenToMe = 0;
  }
  overDueValue.innerHTML = `${numOverdueTasks + numOverdueGivenToMe}<div id="tasksOverdue">Overdue</div>`;
}

// Updates the value for "Tasks" found in upper right corner
// Should be called whenever a task is added, edited, or deleted
// Called in fetchTasks() because we do that every time
export const updateTotalTaskValue = async () => {
  const totalTaskValue = document.querySelector('#tasksDueValue');
  const res = await fetch('/tasks/incomplete');
  let { tasks } = await res.json();
  let myTasks;
  if (tasks) {
    myTasks = tasks.length;
  } else {
    myTasks = 0;
  }

  const givenToMe = await fetch('/lists/given-to-me-incomplete');
  let { tasksGivenToMe } = await givenToMe.json();
  let numTasksGivenToMe;
  if (tasksGivenToMe) {
    numTasksGivenToMe = tasksGivenToMe.length;
  } else {
    numTasksGivenToMe = 0;
  }

  totalTaskValue.innerHTML = `${myTasks + numTasksGivenToMe}<div id="tasksOverdue">Tasks Due</div>`;
}

// Updates the value for "Tasks" found in upper right corner
// Should be called whenever a task is added, edited, or deleted
// Called in fetchTasks() because we do that every time
export const updateTasksCompletedValue = async () => {
  const tasksCompleted = document.querySelector('#tasksCompletedValue');
  const res = await fetch('/tasks/complete');
  let { tasks } = await res.json();
  let tasksComplete;

  if (tasks) {
    tasksComplete = tasks.length;
  } else {
    tasksComplete = 0;
  }

  const given = await fetch('/lists/given-to-me-complete');
  let { tasksGiven } = await given.json();
  let tasksGivenComplete;

  if (tasksGiven) {
    tasksGivenComplete = tasksGiven.length;
  } else {
    tasksGivenComplete = 0;
  }

  tasksCompleted.innerHTML = `${tasksComplete + tasksGivenComplete}<div id="tasksCompleted">Completed</div>`;
}


// Updates the task list container, passing in the tasks and listName
export const updateTaskListContainer = async (tasks, listName) => {
  const tasksListContainer = document.querySelector(".task-list");

  const tasksHtml = tasks.map((task) => {
    if (task.isCompleted === true) {
      return `
      <div class='task-info' id=${task.id}>
      <input type="checkbox" class="task-check-box" id=${task.id} name=${task.id} checked>
      <label for=${task.id} id=${task.id} class="task-check-box">${task.description}</label>
      </div>
      `
    } else if (task.isCompleted === false && dueDateFormatter(task) === 'OVERDUE') {
      return `<div class='task-info' id=${task.id}>
      <input type="checkbox" class="task-check-box" id=${task.id} name=${task.id}>
      <label for=${task.id} id=${task.id} class="task-check-box" style='color: red'>${task.description}</label>
      </div>
      `
    } else if (task.isCompleted === false) {
      return `<div class='task-info' id=${task.id}>
      <input type="checkbox" class="task-check-box" id=${task.id} name=${task.id}>
      <label for=${task.id} id=${task.id} class="task-check-box">${task.description}</label>
      </div>
      `
    }
  })
  tasksListContainer.innerHTML = listName + tasksHtml.join("");
}
